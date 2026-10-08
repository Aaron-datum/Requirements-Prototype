import { defineConfig } from '@playwright/test'

// Chromium is pre-installed in the cloud sandbox; locally Playwright's own browser is used when this path is absent.
import { existsSync } from 'node:fs'
const sandbox = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const PORT = Number(process.env.PW_PORT ?? 4173)

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    launchOptions: existsSync(sandbox) ? { executablePath: sandbox } : {},
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !!process.env.PW_REUSE,
    timeout: 180_000,
  },
})
