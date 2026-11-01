import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import { createContactRequest } from '../../Controllers/contactController.js';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../../Models/SupportRequestSchema.js', () => ({
    default: { countDocuments: vi.fn(), create: vi.fn() },
    supportCategories: ['account', 'appointment', 'payment', 'medical-records', 'technical', 'feedback', 'other'],
}));
const valid = {
    fullname: 'Test User',
    email: 'user@example.com',
    phone: '0901234567',
    category: 'technical',
    subject: 'ignored',
    message: 'Something failed',
    captchaToken: 'verified-token',
};
const run = async (body = valid, identity = {}) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    await createContactRequest({ body, ip: '127.0.0.1', ...identity }, res);
    return res;
};
beforeEach(() => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret');
    vi.stubEnv('JWT_SECRET_KEY', 'test-jwt');
    vi.stubEnv('RECAPTCHA_ALLOWED_HOSTNAMES', 'localhost');
    SupportRequest.countDocuments.mockResolvedValue(0);
    SupportRequest.create.mockResolvedValue({ _id: 'request-1' });
    axios.post.mockResolvedValue({ data: { success: true, hostname: 'localhost' } });
});
describe('contact request submission', () => {
    it('saves guest contact information and drops unrelated subject and client identity', async () => {
        const res = await run({ ...valid, senderId: 'forged', senderRole: 'admin' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(SupportRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                phone: '0901234567',
                subject: '',
                senderId: null,
                senderRole: 'guest',
            }),
        );
        expect(SupportRequest.create.mock.calls[0][0].submissionIp).not.toBe('127.0.0.1');
    });
    it('links edited contact details to the server-authenticated identity', async () => {
        await run(
            { ...valid, category: 'other', subject: 'Custom issue' },
            { userId: 'account-1', userRole: 'doctor' },
        );
        expect(SupportRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
                senderId: 'account-1',
                senderRole: 'doctor',
                subject: 'Custom issue',
            }),
        );
    });
    it.each([
        { ...valid, category: 'unknown' },
        { ...valid, category: 'other', subject: ' ' },
        { ...valid, phone: 'bad' },
        { ...valid, email: 'bad' },
        { ...valid, message: ' ' },
    ])('rejects invalid input before verifying CAPTCHA', async (body) => {
        const res = await run(body);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(axios.post).not.toHaveBeenCalled();
        expect(SupportRequest.create).not.toHaveBeenCalled();
    });
    it('rejects missing CAPTCHA', async () => {
        const res = await run({ ...valid, captchaToken: '' });
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'captchaRequired' });
    });
    it.each([{ success: false }, { success: true, hostname: 'unexpected.example' }])(
        'rejects unverified CAPTCHA',
        async (data) => {
            axios.post.mockResolvedValue({ data });
            const res = await run();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(SupportRequest.create).not.toHaveBeenCalled();
        },
    );
    it('fails closed when server CAPTCHA configuration is missing', async () => {
        vi.stubEnv('RECAPTCHA_SECRET_KEY', '');
        const res = await run();
        expect(res.status).toHaveBeenCalledWith(503);
        expect(SupportRequest.create).not.toHaveBeenCalled();
    });
    it('limits repeated submissions before consuming CAPTCHA', async () => {
        SupportRequest.countDocuments.mockResolvedValue(5);
        const res = await run();
        expect(res.status).toHaveBeenCalledWith(429);
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('handles CAPTCHA service failure without saving', async () => {
        axios.post.mockRejectedValue(new Error('network'));
        const res = await run();
        expect(res.status).toHaveBeenCalledWith(503);
        expect(SupportRequest.create).not.toHaveBeenCalled();
    });
});
