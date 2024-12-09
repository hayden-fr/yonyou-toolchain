import { globbySync } from 'globby'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePath, type PluginOption } from 'vite'

const joinPath = (...paths: string[]) => {
  return normalizePath(path.join(...paths))
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PLUGIN_ROOT_DIR = path.dirname(__dirname)
const TEMPLATE_DIR = joinPath(PLUGIN_ROOT_DIR, 'template')

export interface UserConfig {
  buildEntryPath?: string[]
  extendBuildEntryPath?: string[]
  buildWithoutHTML?: string[]
  proxyTarget?: string
  devPort?: number
}

export const defineConfig = (config: UserConfig) => config

export default function viteMultiPagePlugin(
  config: UserConfig,
): PluginOption[] {
  const projectRoot = joinPath(process.cwd(), 'src')

  const buildEntryPath = globbySync(config.buildEntryPath ?? [], {
    cwd: projectRoot,
  })

  const buildEntryHtmlMap = Object.fromEntries(
    buildEntryPath.map((filePath) => {
      const extname = path.extname(filePath)
      return [
        joinPath('/nccloud/resources', filePath.replace(extname, '.html')),
        joinPath('/src', filePath),
      ]
    }),
  )

  return [
    {
      name: 'vite-plugin-multi-page-server',
      apply: 'serve',
      config() {
        return {
          server: {
            port: config.devPort ?? 3006,
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
            res.writeHead(302, { location: '/nccloud/' })
            res.end()
            return
          }

          if (reqUrl?.endsWith('.html')) {
            if (reqUrl in buildEntryHtmlMap) {
              const html = renderEntryHtml(buildEntryHtmlMap[reqUrl])
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/html')
              res.end(await server.transformIndexHtml(reqUrl, html))
              return
            }
          }

          next()
        })
      },
    },
  ]
}

function renderEntryHtml(entryPath: string) {
  const templateFilePath = joinPath(TEMPLATE_DIR, 'index.html')
  const template = fs.readFileSync(templateFilePath, 'utf-8')

  return template.replace(
    '{{ entryScript }}',
    `<script src="${entryPath}" type="module"></script>`,
  )
}
