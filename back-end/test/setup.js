import { afterEach, vi } from 'vitest';

// Chỉ là giá trị giả; SDK mạng vẫn phải mock trong test.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET_KEY = 'unit-test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_unit_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_unit_dummy';
process.env.CLIENT_SITE_URL = 'http://localhost:5173';
process.env.EMAIL_USERNAME = 'unit@example.test';

// Controller/utility không được tự đọc .env thật khi unit test.
vi.mock('dotenv', () => ({
  default: { config: vi.fn(() => ({ parsed: {} })) },
  config: vi.fn(() => ({ parsed: {} })),
}));

afterEach(() => {
  vi.useRealTimers();
});
