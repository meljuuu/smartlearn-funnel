const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome', headless: true, screenshot: 'only-on-failure' },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:4173', reuseExistingServer: false }
});
