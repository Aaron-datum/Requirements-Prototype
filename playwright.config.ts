import { defineConfig } from '@playwright/test'

// Chromium is pre-installed in the cloud sandbox; locally Playwright's own browser is used when this path is absent.
import { existsSync } from 'node:fs'
const sandbox = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    launchOptions: existsSync(sandbox) ? { executablePath: sandbox } : {},
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
