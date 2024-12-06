import { type PluginOption } from 'vite'

export default function viteMultiPagePlugin(): PluginOption[] {
  return [
    {
      name: 'vite-plugin-multi-page-server',
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
