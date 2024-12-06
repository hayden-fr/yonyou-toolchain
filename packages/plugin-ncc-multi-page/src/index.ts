import { type PluginOption } from 'vite'

export interface UserConfig {
  buildEntryPath: string[]
  extendBuildEntryPath: string[]
  buildWithoutHTML: string[]
  proxyTarget: string
  devPort: number
}

export const defineConfig = (config: UserConfig) => config

export default function viteMultiPagePlugin(
  config: UserConfig,
): PluginOption[] {
  return [
    {
      name: 'vite-plugin-multi-page-server',
      config() {
        return {
          server: {
            port: config.devPort,
            proxy: {
              '/nccloud': {
                target: config.proxyTarget,
              },
            },
          },
        }
      },
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const reqUrl = req.url

          if (reqUrl === '/') {
            res.writeHead(302, { location: '/nccloud' })
            res.end()
            return
          }

          next()
        })
      },
    },
  ]
}
