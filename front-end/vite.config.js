import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    server: {
        port: 5173,
    },
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets/data/mock-data/Healmate_Appointment_Record_2023.csv',
                    dest: 'mock-data',
                },
                {
                    src: 'src/assets/data/mock-data/Medicine.csv',
                    dest: 'mock-data',
                },
            ],
        }),
    ],
});
