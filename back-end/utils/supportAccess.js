import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createHash, timingSafeEqual } from 'node:crypto';
import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import SupportRequest from '../Models/SupportRequestSchema.js';

export const hashGuestToken = (token) => createHash('sha256').update(token).digest('hex');
export const supportError = (code, status = 403) => Object.assign(new Error(code), { code, status });
export const getSupportAccount = async (token) => {
    let identity;
    try {
        identity = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch {
        throw supportError('forbidden', 401);
    }
    if (!mongoose.isObjectIdOrHexString(identity.id) || !['admin', 'patient', 'doctor'].includes(identity.role))
        throw supportError('forbidden', 401);
    const Model = identity.role === 'doctor' ? Doctor : User;
    const account = await Model.findById(identity.id).select('fullname role').lean();
    if (!account || account.role !== identity.role) throw supportError('forbidden', 403);
    return { id: String(account._id), role: account.role, fullname: account.fullname, expiresAt: identity.exp * 1000 };
};
export const getSupportAccess = async ({ token, guestToken, requestId }) => {
    if (!mongoose.isObjectIdOrHexString(requestId)) throw supportError('invalidId', 400);
    const request = await SupportRequest.findById(requestId).select('+guestAccessHash').lean();
    if (!request) throw supportError('notFound', 404);
    if (
        request.senderRole === 'guest' &&
        typeof guestToken === 'string' &&
        /^[a-f0-9]{64}$/.test(guestToken) &&
        request.guestAccessHash
    ) {
        const expected = Buffer.from(request.guestAccessHash, 'hex');
        const actual = Buffer.from(hashGuestToken(guestToken), 'hex');
        if (expected.length === actual.length && timingSafeEqual(expected, actual)) {
            return { request, account: { id: null, role: 'guest', fullname: request.fullname }, senderKey: 'guest' };
        }
    }
    const account = await getSupportAccount(token);
    const owner = String(request.senderId) === account.id && request.senderRole === account.role;
    if (account.role !== 'admin' && !owner) throw supportError('forbidden');
    return { request, account, senderKey: account.role + ':' + account.id };
};
export const supportCredentials = (req) => ({
    token: req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined,
    guestToken: req.headers['x-support-token'],
    requestId: req.params.id,
});
export const publicSupportRequest = (request) => ({
    _id: request._id,
    category: request.category,
    subject: request.subject,
    message: request.message,
    fullname: request.fullname,
    status: request.status,
    createdAt: request.createdAt,
});
