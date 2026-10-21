import { defineConfig } from 'vitest/config';
import process from 'node:process';
import react from '@vitejs/plugin-react';

process.env.TZ = 'Asia/Ho_Chi_Minh';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: { url: 'http://localhost:5173' },
        },
        include: ['src/**/*.test.{js,jsx}'],
        setupFiles: ['./src/test/setup.js'],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/test/**', 'src/assets/**', 'src/main.jsx', 'src/utils/services/firebase.js'],
        },
    },
});
