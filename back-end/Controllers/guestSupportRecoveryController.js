import { randomBytes, createHmac } from 'node:crypto';
import validator from 'validator';
import Recovery from '../Models/GuestSupportRecoverySchema.js';
import Session from '../Models/GuestSupportSessionSchema.js';
import Rate from '../Models/GuestSupportRecoveryRateSchema.js';
import SupportRequest from '../Models/SupportRequestSchema.js';
import mailTransporter from '../utils/mailTransporter.js';
import { guestRecoveryMail } from '../utils/guestRecoveryMail.js';
import { hashGuestToken } from '../utils/supportAccess.js';

const MINUTE = 60000;
const validToken = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
const accepted = (res) => res.status(202).json({ success: true, code: 'recoveryRequested' });
const invalid = (res) => res.status(400).json({ success: false, code: 'recoveryInvalid' });
const privateResponse = (res) => res.set('Cache-Control', 'no-store');
const filterEmail = (email) => ({
    senderRole: 'guest',
    email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
});
const consumeRate = async (scope, value, limit, cooldown = 0) => {
    const now = Date.now();
    const bucket = Math.floor(now / (60 * MINUTE));
    const digest = createHmac('sha256', process.env.JWT_SECRET_KEY).update(value).digest('hex');
    try {
        return Boolean(
            await Rate.findOneAndUpdate(
                {
                    _id: scope + ':' + digest + ':' + bucket,
                    count: { $lt: limit },
                    ...(cooldown ? { lastAt: { $lte: new Date(now - cooldown) } } : {}),
                },
                {
                    $inc: { count: 1 },
                    $set: { lastAt: new Date(now) },
                    $setOnInsert: { expiresAt: new Date((bucket + 1) * 60 * MINUTE) },
                },
                { upsert: true, new: true, setDefaultsOnInsert: false },
            ).lean(),
        );
    } catch (error) {
        if (error.code === 11000) return false;
        throw error;
    }
};
const deliverGuestRecovery = async (email, language, link) => {
    let recovery;
    try {
        if (!(await SupportRequest.exists(filterEmail(email)))) return;
        const token = randomBytes(32).toString('hex');
        recovery = await Recovery.create({
            email,
            language,
            tokenHash: hashGuestToken(token),
            expiresAt: new Date(Date.now() + 15 * MINUTE),
        });
        link.searchParams.set('language', language);
        link.hash = new URLSearchParams({ token }).toString();
        await mailTransporter.sendMail({ to: email, ...guestRecoveryMail(language, link.toString()) });
    } catch {
        if (recovery) await Recovery.deleteOne({ _id: recovery._id }).catch(() => {});
        console.error('Guest support recovery email delivery failed');
    }
};
export const requestGuestRecovery = async (req, res) => {
    privateResponse(res);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !validator.isEmail(email))
        return res.status(400).json({ success: false, code: 'recoveryEmailInvalid' });
    const language = req.body.language === 'vi' ? 'vi' : 'en';
    try {
        // Use the configured application origin, never a client-supplied Host or redirect URL.
        const link = new URL('/support-requests/recover', process.env.CLIENT_SITE_URL);
        if (!['http:', 'https:'].includes(link.protocol)) throw new Error('invalid client origin');
        const ipAllowed = await consumeRate('ip', req.ip || req.socket?.remoteAddress || 'unknown', 20);
        if (!ipAllowed || !(await consumeRate('email', email, 5, MINUTE))) return accepted(res);
        // Reply before mailbox lookup/provider work so delivery latency cannot reveal mailbox existence.
        void deliverGuestRecovery(email, language, link);
        return accepted(res);
    } catch {
        return res.status(503).json({ success: false, code: 'recoveryUnavailable' });
    }
};
export const inspectGuestRecovery = async (req, res) => {
    privateResponse(res);
    if (!validToken(req.body?.token)) return invalid(res);
    try {
        const recovery = await Recovery.findOne({
            tokenHash: hashGuestToken(req.body.token),
            usedAt: null,
            expiresAt: { $gt: new Date() },
        })
            .select('language expiresAt')
            .lean();
        if (!recovery) return invalid(res);
        return res.json({ success: true, language: recovery.language, expiresAt: recovery.expiresAt });
    } catch {
        return res.status(503).json({ success: false, code: 'recoveryUnavailable' });
    }
};
export const confirmGuestRecovery = async (req, res) => {
    privateResponse(res);
    if (!validToken(req.body?.token)) return invalid(res);
    let session;
    try {
        const query = { tokenHash: hashGuestToken(req.body.token), usedAt: null, expiresAt: { $gt: new Date() } };
        const recovery = await Recovery.findOne(query).select('email language').lean();
        if (!recovery) return invalid(res);
        const requests = await SupportRequest.find(filterEmail(recovery.email))
            .select('_id')
            .sort({ createdAt: -1, _id: -1 })
            .limit(100)
            .lean();
        if (!requests.length) return invalid(res);
        const guestToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * MINUTE);
        session = await Session.create({
            tokenHash: hashGuestToken(guestToken),
            requestIds: requests.map((r) => r._id),
            expiresAt,
        });
        // Compare-and-set makes confirmation single use, including concurrent clicks from different tabs.
        const consumed = await Recovery.findOneAndUpdate(
            { ...query, expiresAt: { $gt: new Date() } },
            { $set: { usedAt: new Date() } },
            { new: true },
        ).lean();
        if (!consumed) {
            await Session.deleteOne({ _id: session._id });
            session = null;
            return invalid(res);
        }
        return res.json({
            success: true,
            language: recovery.language,
            data: { requests: requests.map((r) => ({ id: String(r._id), guestToken })), expiresAt },
        });
    } catch {
        if (session) await Session.deleteOne({ _id: session._id }).catch(() => {});
        return res.status(503).json({ success: false, code: 'recoveryUnavailable' });
    }
};
