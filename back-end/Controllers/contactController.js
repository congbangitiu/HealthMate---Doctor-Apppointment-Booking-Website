import axios from 'axios';
import validator from 'validator';
import { createHmac } from 'node:crypto';
import SupportRequest, { supportCategories } from '../Models/SupportRequestSchema.js';

export const createContactRequest = async (req, res) => {
    const fail = (status, code) => res.status(status).json({ success: false, code });
    const body = req.body || {};
    const text = (key) => (typeof body[key] === 'string' ? body[key].trim() : '');
    const fullname = text('fullname'),
        email = text('email'),
        phone = text('phone');
    const category = text('category'),
        subject = category === 'other' ? text('subject') : '';
    const message = text('message'),
        captchaToken = text('captchaToken');
    if (
        !fullname ||
        fullname.length > 120 ||
        email.length > 254 ||
        !validator.isEmail(email) ||
        !/^[0-9]{9,15}$/.test(phone) ||
        !supportCategories.includes(category) ||
        (category === 'other' && (!subject || subject.length > 200)) ||
        !message ||
        message.length > 5000
    )
        return fail(400, 'invalidFields');
    if (!captchaToken || captchaToken.length > 4096) return fail(400, 'captchaRequired');
    if (!process.env.RECAPTCHA_SECRET_KEY || !process.env.JWT_SECRET_KEY) return fail(503, 'unavailable');

    try {
        const submissionIp = createHmac('sha256', process.env.JWT_SECRET_KEY)
            .update(req.ip || '')
            .digest('hex');
        const recent = await SupportRequest.countDocuments({
            submissionIp,
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
        });
        if (recent >= 5) return fail(429, 'rateLimited');
        let verification;
        try {
            verification = await axios.post(
                'https://www.google.com/recaptcha/api/siteverify',
                new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY, response: captchaToken }).toString(),
                { timeout: 10000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
            );
        } catch {
            return fail(503, 'unavailable');
        }
        if (verification.data.success !== true) return fail(400, 'captchaInvalid');
        const allowedHosts = (process.env.RECAPTCHA_ALLOWED_HOSTNAMES || '')
            .split(',')
            .map((host) => host.trim())
            .filter(Boolean);
        if (allowedHosts.length && !allowedHosts.includes(verification.data.hostname))
            return fail(400, 'captchaInvalid');
        const request = await SupportRequest.create({
            fullname,
            email,
            phone,
            category,
            subject,
            message,
            submissionIp,
            senderId: req.userId || null,
            senderRole: req.userRole || 'guest',
        });
        return res.status(201).json({ success: true, data: { id: request._id.toString() } });
    } catch {
        return fail(500, 'sendFailed');
    }
};
