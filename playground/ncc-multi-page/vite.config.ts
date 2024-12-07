import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import multiPage from 'vite-plugin-ncc-multi-page'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [multiPage(), react()],
    server: {
      port: 3006,
      proxy: {
        '/nccloud': {
          target: env.PROXY_TARGET,
        },
      },
    },
  }
})
