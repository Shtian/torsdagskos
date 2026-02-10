import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4321;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`;

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL,
    trace: "retry-with-trace",
  },
  projects: [
    {
      name: "global setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "Authenticated",
      use: {
        ...devices["Desktop Chrome"],
        // Use prepared auth state.
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["global setup"],
      grepInvert: /@unauth/,
    },
    {
      name: "Unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      grep: /@unauth/,
    },
  ],
});
