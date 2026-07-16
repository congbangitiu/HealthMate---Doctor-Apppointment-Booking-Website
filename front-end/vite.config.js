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
        // Nâng ngưỡng cảnh báo vì chunk vendor mặc định có thể vượt 500 kB.
        // KHÔNG dùng manualChunks tự chế: việc tách react ra khỏi các package
        // phụ thuộc react gây lỗi "Cannot access '...' before initialization"
        // (circular dependency giữa các chunk) khi chạy. Vite mặc định + lazy
        // route (React.lazy) đã tách bundle an toàn và đúng thứ tự khởi tạo.
        chunkSizeWarningLimit: 1000,
    },
});
