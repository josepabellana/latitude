import buildDockerImage from './docker/build'
import chalk from 'chalk'
import counter from '$src/lib/counter'
import findConfigFile from '$src/lib/latitudeConfig/findConfigFile'
import ora from 'ora'
import pushDockerImage from './docker/push'
import tracked from '$src/lib/decorators/tracked'
import { request, sseRequest } from '$src/lib/server'

async function deploy({ name, digest }: { name: string; digest: string }) {
  const spinner = ora(`Deploying ${name}...`).start()
  const stream = await sseRequest({
    method: 'POST',
    path: '/api/apps/deploy',
    data: JSON.stringify({ app: name, digest }),
  })

  let output: string

  const clock = counter()
  stream.on('data', (chunk) => {
    clock.end()

    const payload = JSON.parse(chunk.toString())
    if (payload.error) {
      spinner.stop()

      console.log(chalk.red('Failed to deploy: ', payload.message))

      process.exit(1)
    }

    if (payload.done) {
      output = payload.message
    } else if (payload?.deploy?.status === 'in_progress') {
      const message = payload.message

      clock.tick((diff) => {
        const mm = String(diff.getUTCMinutes()).padStart(2, '0')
        const ss = String(diff.getUTCSeconds()).padStart(2, '0')

        spinner.text = message + ' ' + `${mm}:${ss}`
      })

      clock.start()
    } else {
      spinner.text = payload.message
    }
  })

  stream.on('error', (error) => {
    console.error(chalk.red('Failed to deploy:', error.message))

    process.exit(1)
  })

  stream.on('end', () => {
    spinner.stop()

    console.log(`
${chalk.green('Deployed successfully!')}

Check your application at: ${chalk.bold(output)}
`)

    process.exit(0)
  })
}

async function deployCommand(
  { force = false, nocache = false }: { force?: boolean; nocache?: boolean } = {
    force: false,
    nocache: false,
  },
) {
  const latitudeJson = findConfigFile()
  const name = latitudeJson.data.name!

  console.log(`Deploying ${name}...`)

  const { url, latestImage } = await request({
    method: 'POST',
    path: '/api/ecr/repositories/find-or-create',
    data: JSON.stringify({ name }),
  })
    .then(({ body }) => JSON.parse(body))
    .catch((err) => {
      console.error(chalk.red('Failed to get/create registry:', err.message))

      process.exit(1)
    })

  const tags = [`${url}:latest`] as [string]
  const { username, password } = await request({ path: '/api/ecr/credentials' })
    .then(({ body }) => JSON.parse(body))
    .catch((err) => {
      console.error(
        chalk.red('Failed to get registry credentials:', err.message),
      )

      process.exit(1)
    })

  try {
    await buildDockerImage({ tags, noCache: nocache })
    const digest = await pushDockerImage({
      username,
      password,
      url,
      tags,
    })

    if (digest === latestImage?.imageDigest && !force) {
      console.log(
        chalk.yellow(`
No changes detected, skipping deployment. To force a new deployment, run: 

 ${chalk.green('latitude deploy --force')}
`),
      )

      process.exit(0)
    }

    deploy({ name, digest })
  } catch (error) {
    console.error(chalk.red('Failed to deploy:', (error as Error).message))

    process.exit(1)
  }
}

export default tracked('deployCommand', deployCommand)