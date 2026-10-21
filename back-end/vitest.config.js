import { defineConfig } from 'vitest/config';

process.env.TZ = 'Asia/Ho_Chi_Minh';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'auth/**/*.js',
        'Controllers/**/*.js',
        'utils/**/*.js',
        'Models/**/*.js',
      ],
      exclude: ['utils/cloudinaryConfig.js'],
    },
  },
});
