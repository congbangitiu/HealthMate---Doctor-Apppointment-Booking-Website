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
        // Nâng nhẹ ngưỡng cảnh báo: các vendor chunk lớn (pdf, firebase) là bình thường và đã được tách riêng, nên cảnh báo 500 kB gây nhiễu.
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                // Tách các thư viện nặng thành chunk vendor riêng để cache tốt hơn và tránh gộp tất cả vào một bundle khổng lồ.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (id.includes('react-router') || id.includes('/react-dom/') || /\/react\//.test(id)) {
                        return 'react-vendor';
                    }
                    if (id.includes('@mui') || id.includes('@emotion')) return 'mui-vendor';
                    if (id.includes('antd') || id.includes('rc-') || id.includes('@ant-design')) return 'antd-vendor';
                    if (id.includes('firebase') || id.includes('@firebase')) return 'firebase-vendor';
                    if (id.includes('/d3') || id.includes('d3-')) return 'd3-vendor';
                    if (
                        id.includes('jspdf') ||
                        id.includes('pdf-lib') ||
                        id.includes('@react-pdf') ||
                        id.includes('html2canvas') ||
                        id.includes('react-to-pdf') ||
                        id.includes('react-to-print')
                    ) {
                        return 'pdf-vendor';
                    }
                    if (id.includes('emoji-mart') || id.includes('@emoji-mart')) return 'emoji-vendor';
                    if (id.includes('swiper')) return 'swiper-vendor';

                    return 'vendor';
                },
            },
        },
    },
});
