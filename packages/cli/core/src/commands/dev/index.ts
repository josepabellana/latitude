import InstalledVersionChecker from '$src/lib/latitudeConfig/InstalledVersionChecker'
import config from '$src/config'
import sync from '$src/lib/sync'
import { CommonCLIArgs } from '$src/types'
import { DevServerProps, runDevServer } from './runDev'
import findOrCreateConfigFile from '$src/lib/latitudeConfig/findOrCreate'
import tracked from '$src/lib/decorators/tracked'
import setup from '$src/lib/decorators/setup'
import setRootDir from '$src/lib/decorators/setRootDir'
import versionCheck from '$src/lib/decorators/versionCheck'

export type Props = CommonCLIArgs & { open?: boolean; port?: number }

async function devCommand(
  { open = config.prod, port }: Props = { open: config.prod },
) {
  await sync({
    watch: true,
  })

  runDevServer(await buildServerProps({ open, port }))
}

const buildServerProps = async ({
  open,
  port,
}: {
  open: boolean
  port?: number
}) => {
  const server: DevServerProps = {
    open: open,
    port: port,
    appFolder: config.rootDir,
    verbose: config.verbose,
  }
  const latitudeJson = await findOrCreateConfigFile()
  const checker = new InstalledVersionChecker({
    cwd: config.rootDir,
    // TODO: Fix this. Version should never be undefined in reality.
    configVersion: latitudeJson.data.version as string,
  })

  return checker.isDifferent()
    ? ({
        ...server,
        onReady: (devUrl) => {
          checker.displayMessage(devUrl)
        },
      } as DevServerProps)
    : server
}

export default tracked(
  'devCommand',
  versionCheck(setRootDir(setup(devCommand))),
)
