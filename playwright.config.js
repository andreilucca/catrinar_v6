const fs = require('node:fs');
const { defineConfig } = require('@playwright/test');

const systemChromiumPath = ['/usr/bin/chromium-browser', '/usr/bin/chromium'].find((path) =>
  fs.existsSync(path)
);

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/catrinar_v6/',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1100 },
    launchOptions: systemChromiumPath ? { executablePath: systemChromiumPath } : {},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory /home/runner/work/catrinar_v6',
    url: 'http://127.0.0.1:4173/catrinar_v6/',
    reuseExistingServer: true
  }
});
