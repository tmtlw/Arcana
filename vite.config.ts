import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

// Cloudflare Pages beállítja a CF_PAGES_COMMIT_SHA-t; lokálisan git-ből olvassuk.
const commitSha = (() => {
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA
  try { return execSync('git rev-parse HEAD').toString().trim() } catch { return 'unknown' }
})()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // FIGYELEM: a teljes process.env beágyazása kiszivárogtatná a build környezet titkait.
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
