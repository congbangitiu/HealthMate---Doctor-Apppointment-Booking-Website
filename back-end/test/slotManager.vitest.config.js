import { defineConfig } from 'vitest/config';
import baseConfig from '../vitest.config.js';

// Use a fresh Node process per timezone; changing TZ inside a worker can be unreliable.
process.env.TZ = process.env.SLOT_TEST_TZ || 'Asia/Ho_Chi_Minh';

export default defineConfig({
    ...baseConfig,
    test: {
        ...baseConfig.test,
        include: ['test/utils/slotManager.test.js'],
        pool: 'forks',
    },
});
