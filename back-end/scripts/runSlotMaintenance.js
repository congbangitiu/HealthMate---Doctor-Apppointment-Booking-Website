// Script chạy-1-lần cho Render Cron Job: dọn slot hết hạn + sinh slot tuần mới.
// LƯU Ý: Render Cron Job chạy theo giờ UTC. 00:00 giờ VN (GMT+7) = 17:00 UTC, nên schedule trong render.yaml là "0 17 * * *".
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    removeExpiredSlotsForAllDoctors,
    generateWeeklySlotsForAllDoctors,
} from '../utils/slotManager.js';

dotenv.config();

const run = async () => {
    if (!process.env.MONGO_URL) {
        console.error('Missing MONGO_URL env var. Aborting.');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected. Running slot maintenance...');

        await removeExpiredSlotsForAllDoctors();
        await generateWeeklySlotsForAllDoctors();

        console.log('Slot maintenance finished successfully.');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Slot maintenance failed:', error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
};

run();
