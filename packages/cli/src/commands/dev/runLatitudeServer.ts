import colors from 'picocolors'
import config from '../../config'
import path from 'path'
import watchQueries from './watchQueries'
import watchViews from './watchViews'
import { runDevServer } from './runDev'
import type { DevServerProps } from './runDev'
import { APP_FOLDER, DEV_SITES_ROUTE_PREFIX } from '../constants'

export function getDefaultCwd(): string {
  const naturalCwd = process.cwd()

  const isPro = config.pro
  if (isPro) return naturalCwd

  return path.join(naturalCwd, DEV_SITES_ROUTE_PREFIX)
}

function getCwd(cwd?: string): string {
  // If cwd is provided, use it.
  if (cwd) return cwd

  return getDefaultCwd()
}

function getRoutesFolderPath(cwd: string, routePath: string | null): string {
  const basePath = path.join(cwd, APP_FOLDER, 'src', 'routes')
  return routePath ? `${basePath}/${routePath}` : basePath
}

type Props = {
  devServer: DevServerProps
  dataAppDir?: string
}
export default async function runLatitudeServer(props: Props) {
  const devServerProps = props.devServer ?? {}
  const cwd = getCwd(devServerProps?.appFolder)
  const appName = path.basename(cwd)
  const routePath = config.pro ? null : `/${DEV_SITES_ROUTE_PREFIX}/${appName}`
  const devServer: DevServerProps = {
    ...devServerProps,
    open: devServerProps?.open ?? true,
    appFolder: `${cwd}/${APP_FOLDER}`,
    routePath,
  }

  const routesFolder = getRoutesFolderPath(cwd, routePath)
  await watchViews({ dataAppDir: cwd, destinationDir: routesFolder })
  await watchQueries(cwd)

  console.log(colors.gray('Starting development server... \n'))
  runDevServer(devServer)
}