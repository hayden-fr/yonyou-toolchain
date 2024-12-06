import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import multiPage from 'vite-plugin-ncc-multi-page'
import config from './multi.config'

export default defineConfig({
  plugins: [multiPage(config), react()],
})
