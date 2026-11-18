import { beforeEach, describe, expect, it, vi } from 'vitest';
import Recovery from '../../Models/GuestSupportRecoverySchema.js';
import Session from '../../Models/GuestSupportSessionSchema.js';
import Rate from '../../Models/GuestSupportRecoveryRateSchema.js';
import SupportRequest from '../../Models/SupportRequestSchema.js';
import mail from '../../utils/mailTransporter.js';
import { hashGuestToken } from '../../utils/supportAccess.js';
import {
    requestGuestRecovery,
    inspectGuestRecovery,
    confirmGuestRecovery,
} from '../../Controllers/guestSupportRecoveryController.js';
vi.mock('../../Models/GuestSupportRecoverySchema.js', () => ({
    default: { create: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(), deleteOne: vi.fn() },
}));
vi.mock('../../Models/GuestSupportSessionSchema.js', () => ({
    default: { create: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn() },
}));
vi.mock('../../Models/GuestSupportRecoveryRateSchema.js', () => ({ default: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../Models/SupportRequestSchema.js', () => ({ default: { exists: vi.fn(), find: vi.fn() } }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: vi.fn() } }));
const token = 'a'.repeat(64);
const chain = (value) => ({
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
});
const call = async (handler, body = {}) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis() };
    await handler({ body, ip: '127.0.0.1' }, res);
    await new Promise((resolve) => setImmediate(resolve));
    return res;
};
beforeEach(() => {
    Rate.findOneAndUpdate.mockReturnValue(chain({ count: 1 }));
    SupportRequest.exists.mockResolvedValue({ _id: 'one' });
    SupportRequest.find.mockReturnValue(chain([{ _id: 'one' }, { _id: 'two' }]));
    Recovery.create.mockResolvedValue({ _id: 'challenge' });
    Recovery.findOne.mockReturnValue(chain({ email: 'guest@example.test', language: 'vi' }));
    Recovery.findOneAndUpdate.mockReturnValue(chain({ _id: 'challenge', usedAt: new Date() }));
    Recovery.deleteOne.mockResolvedValue({ deletedCount: 1 });
    Session.create.mockResolvedValue({ _id: 'session' });
    Session.deleteOne.mockResolvedValue({ deletedCount: 1 });
    mail.sendMail.mockResolvedValue({ messageId: 'sent' });
});
describe('guest support email recovery', () => {
    it.each(['vi', 'en', 'unknown'])(
        'sends the %s template with a hashed, 15-minute, fragment-based token and trusted origin',
        async (language) => {
            const before = Date.now();
            const res = await call(requestGuestRecovery, {
                email: ' Guest@Example.test ',
                language,
                redirectUrl: 'https://evil.test',
            });
            expect(res.status).toHaveBeenCalledWith(202);
            const saved = Recovery.create.mock.calls[0][0];
            const message = mail.sendMail.mock.calls[0][0];
            const link = new URL(message.html.match(/href="([^"]+)"/)[1]);
            const raw = new URLSearchParams(link.hash.slice(1)).get('token');
            expect(raw).toMatch(/^[a-f0-9]{64}$/);
            expect(saved.tokenHash).toBe(hashGuestToken(raw));
            expect(saved.tokenHash).not.toBe(raw);
            expect(saved.email).toBe('guest@example.test');
            expect(saved.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 15 * 60000);
            expect(link.origin).toBe('http://localhost:5173');
            expect(link.pathname).toBe('/support-requests/recover');
            expect(link.searchParams.get('language')).toBe(language === 'vi' ? 'vi' : 'en');
            expect(message.html).toContain(language === 'vi' ? '15 ph\u00fat' : '15 minutes');
            expect(JSON.stringify(res.json.mock.calls)).not.toContain(raw);
            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
        },
    );
    it('returns the same accepted response without revealing whether an email has guest requests', async () => {
        SupportRequest.exists.mockResolvedValue(null);
        const res = await call(requestGuestRecovery, { email: 'unknown@example.test' });
        expect(res.json).toHaveBeenCalledWith({ success: true, code: 'recoveryRequested' });
        expect(mail.sendMail).not.toHaveBeenCalled();
        expect(Recovery.create).not.toHaveBeenCalled();
    });
    it('rejects malformed email before querying or sending mail', async () => {
        const res = await call(requestGuestRecovery, { email: 'bad\r\nBcc: victim@example.test' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(Rate.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mail.sendMail).not.toHaveBeenCalled();
    });
    it('rate limits without revealing mailbox existence, using hashed keys and atomic counters', async () => {
        Rate.findOneAndUpdate.mockReturnValue(chain(null));
        const res = await call(requestGuestRecovery, { email: 'guest@example.test' });
        expect(res.status).toHaveBeenCalledWith(202);
        expect(mail.sendMail).not.toHaveBeenCalled();
        expect(SupportRequest.exists).not.toHaveBeenCalled();
        const [filter] = Rate.findOneAndUpdate.mock.calls[0];
        expect(filter._id).not.toContain('127.0.0.1');
        expect(filter.count).toEqual({ $lt: 20 });
    });
    it('treats duplicate-key counter races as a rate limit rather than sending more mail', async () => {
        Rate.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockRejectedValue({ code: 11000 }) });
        const res = await call(requestGuestRecovery, { email: 'guest@example.test' });
        expect(res.status).toHaveBeenCalledWith(202);
        expect(mail.sendMail).not.toHaveBeenCalled();
    });
    it('does not expose provider failures and deletes an undelivered challenge', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        mail.sendMail.mockRejectedValue(new Error('private provider information'));
        const res = await call(requestGuestRecovery, { email: 'guest@example.test' });
        expect(res.status).toHaveBeenCalledWith(202);
        expect(Recovery.deleteOne).toHaveBeenCalledWith({ _id: 'challenge' });
        expect(log).toHaveBeenCalledWith('Guest support recovery email delivery failed');
    });
    it('responds without waiting for the mail provider', async () => {
        let finish;
        mail.sendMail.mockReturnValue(
            new Promise((resolve) => {
                finish = resolve;
            }),
        );
        const res = await call(requestGuestRecovery, { email: 'guest@example.test' });
        expect(res.status).toHaveBeenCalledWith(202);
        expect(mail.sendMail).toHaveBeenCalledOnce();
        finish({ messageId: 'sent' });
    });
    it('only inspects the link on landing and never consumes it or exposes its email', async () => {
        const res = await call(inspectGuestRecovery, { token });
        expect(Recovery.findOne).toHaveBeenCalledWith({
            tokenHash: hashGuestToken(token),
            usedAt: null,
            expiresAt: { $gt: expect.any(Date) },
        });
        expect(res.json).toHaveBeenCalledWith({ success: true, language: 'vi' });
        expect(Recovery.findOneAndUpdate).not.toHaveBeenCalled();
        expect(Session.create).not.toHaveBeenCalled();
    });
    it('rejects expired and previously used links using an explicit expiry filter, independently of TTL cleanup', async () => {
        Recovery.findOne.mockReturnValue(chain(null));
        const res = await call(confirmGuestRecovery, { token });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(Recovery.findOne.mock.calls[0][0]).toMatchObject({ usedAt: null, expiresAt: { $gt: expect.any(Date) } });
        expect(Session.create).not.toHaveBeenCalled();
    });
    it('creates a request-scoped 24-hour session without rotating original guest keys or granting account access', async () => {
        const before = Date.now();
        const res = await call(confirmGuestRecovery, { token });
        const body = res.json.mock.calls[0][0];
        expect(body.data.requests.map((entry) => entry.id)).toEqual(['one', 'two']);
        const newToken = body.data.requests[0].guestToken;
        expect(newToken).not.toBe(token);
        expect(Session.create).toHaveBeenCalledWith({
            tokenHash: hashGuestToken(newToken),
            requestIds: ['one', 'two'],
            expiresAt: expect.any(Date),
        });
        expect(body.data.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 24 * 60 * 60000);
        expect(SupportRequest.find.mock.calls[0][0].senderRole).toBe('guest');
        expect(SupportRequest.find.mock.calls[0][0].email.test('GUEST@example.test')).toBe(true);
        expect(body.token).toBeUndefined();
        expect(body.role).toBeUndefined();
        expect(Recovery.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ usedAt: null, expiresAt: { $gt: expect.any(Date) } }),
            { $set: { usedAt: expect.any(Date) } },
            { new: true },
        );
    });
    it('does not return a usable session to the loser of a concurrent confirmation', async () => {
        Recovery.findOneAndUpdate.mockReturnValue(chain(null));
        const res = await call(confirmGuestRecovery, { token });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(Session.deleteOne).toHaveBeenCalledWith({ _id: 'session' });
        expect(res.json).toHaveBeenCalledWith({ success: false, code: 'recoveryInvalid' });
    });
    it('cleans up a provisional session if consuming the link fails', async () => {
        Recovery.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('db error')) });
        const res = await call(confirmGuestRecovery, { token });
        expect(res.status).toHaveBeenCalledWith(503);
        expect(Session.deleteOne).toHaveBeenCalledWith({ _id: 'session' });
    });
});
