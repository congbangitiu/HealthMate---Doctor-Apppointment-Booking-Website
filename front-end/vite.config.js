import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
    // Keeping Vite's optimized-dependency cache inside a OneDrive-synced node_modules directory can make Windows lock the temporary directory while Vite is renaming it (EPERM). Use a local, non-synced cache.
    cacheDir: path.join(os.tmpdir(), 'healthmate-vite-cache'),
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets/data/mock-data/Healmate_Appointment_Record_2024.csv',
                    dest: 'mock-data',
                },
                {
                    src: 'src/assets/data/mock-data/Medicine.csv',
                    dest: 'mock-data',
                },
            ],
        }),
    ],
    build: {
        // Raise the warning threshold because the default vendor chunk may exceed 500 kB.
        // Do not use custom manualChunks: separating React from packages that depend on it can cause a "Cannot access '...' before initialization" error at runtime due to circular dependencies between chunks. 
        // Vite's default chunking combined with lazy routes (React.lazy) safely splits the bundle in the correct initialization order.
        chunkSizeWarningLimit: 1000,
    },
});
