import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.js'],
    environment: 'node',
    environmentOptions: {
      // Ensure Node.js environment is properly configured
      env: {
        NODE_OPTIONS: '--experimental-global-webcrypto'
      }
    },
    // Increase timeout for slower CI environments
    testTimeout: 10000,
    // Retry tests that might fail due to environment issues
    retry: 1
  }
});
