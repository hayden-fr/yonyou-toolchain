import { globbySync } from 'globby'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rollup } from 'rollup'
import type { PluginOption, ResolvedConfig } from 'vite'
import { normalizePath } from 'vite'

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

export default function viteMultiPagePlugin(
  config: UserConfig,
): PluginOption[] {
  const projectSource = joinPath(process.cwd(), 'src')

  const buildEntryPath = globbySync(config.buildEntryPath ?? [], {
    cwd: projectSource,
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

  let resolvedConfig: ResolvedConfig

  return [
    {
      name: 'vite-plugin-multi-page-fixed-react-optimizeDeps',
      enforce: 'post',
      config(originalConfig) {
        if (originalConfig.optimizeDeps?.include) {
          const viteReactOptimizeDeps = [
            'react',
            'react-dom',
            'react/jsx-dev-runtime',
            'react/jsx-runtime',
          ]

          originalConfig.optimizeDeps.include =
            originalConfig.optimizeDeps.include.filter(
              (item) => !viteReactOptimizeDeps.includes(item),
            )
        }
      },
    },
    {
      name: 'vite-plugin-multi-page-build',
      apply: 'build',
      enforce: 'post',
      // config(config, env) {
      //   return {
      //     build: {
      //       rollupOptions: {
      //         external: ['react', 'react-dom'],
      //         output: {
      //           inlineDynamicImports: false,
      //           format: 'umd',
      //         },
      //       },
      //     },
      //   }
      // },
      config() {
        return {
          build: {
            rollupOptions: {
              input: 'virtual:index.html',
            },
          },
        }
      },
      configResolved(config) {
        resolvedConfig = config
      },
      resolveId(id) {
        if ('virtual:index.html' === id) {
          return id
        }
      },
      load(id) {
        if ('virtual:index.html' === id) {
          return `<!DOCTYPE html><html></html>`
        }
      },
      // buildStart(options) {
      //   options.input = Object.fromEntries(
      //     buildEntryPath.map((filPath) => {
      //       return [filPath, joinPath(projectSource, filPath)]
      //     }),
      //   )
      //   // options.
      // },
      async generateBundle(_, bundle) {
        for (const key in bundle) {
          if (Object.prototype.hasOwnProperty.call(bundle, key)) {
            delete bundle[key]
          }
        }

        for (const entryPath of buildEntryPath) {
          console.log(entryPath)
          // console.log(
          //   resolvedConfig.plugins.filter(
          //     (p) => p.name !== 'vite-plugin-multi-page-build',
          //   ),
          // )
          await rollup({
            plugins: resolvedConfig.plugins.filter(
              (p) => p.name !== 'vite-plugin-multi-page-build',
            ),
            input: joinPath(projectSource, entryPath),
            output: {
              format: 'umd',
            },
          })

          // try {
          //   await _bundle.generate({
          //     format: 'umd',
          //   })
          // } catch (_) {
          //   _bundle.close()
          // }
        }
      },
    },
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
