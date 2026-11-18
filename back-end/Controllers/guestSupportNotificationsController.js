import SupportRequest from '../Models/SupportRequestSchema.js';
import { getSupportAccess, supportCredentials, supportError } from '../utils/supportAccess.js';
import {
    emitSupport,
    supportGuestRoom,
    ownerSupportNotification,
    withOwnerSupportActors,
} from '../utils/supportRealtime.js';

const fail = (res, error) => res.status(error.status || 500).json({ success: false, code: error.code || 'loadFailed' });
export const getGuestSupportNotifications = async (req, res) => {
    try {
        const proofs = req.body?.requests;
        if (!Array.isArray(proofs) || proofs.length > 100) throw supportError('invalidId', 400);
        const requests = new Map();
        for (const proof of proofs) {
            if (!proof || typeof proof !== 'object') continue;
            try {
                const { request, account } = await getSupportAccess({
                    requestId: proof.requestId,
                    guestToken: proof.guestToken,
                });
                if (account.role === 'guest') requests.set(String(request._id), request);
            } catch (error) {
                if (![400, 401, 403, 404].includes(error.status)) throw error;
            }
        }
        const rows = [...requests.values()];
        const notices = rows.filter((row) => row.ownerNotificationId);
        const data = (await withOwnerSupportActors(notices))
            .map(ownerSupportNotification)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.json({
            success: true,
            data: data.slice(0, 12),
            unreadCount: notices.filter((row) => row.ownerNotificationRead === false).length,
            unavailableRequestIds: [...new Set(proofs.map((proof) => proof?.requestId).filter((id) => typeof id === 'string' && !requests.has(id)))],
            requests: rows
                .map((row) => ({
                    _id: row._id,
                    category: row.category,
                    subject: row.subject,
                    status: row.status,
                    createdAt: row.createdAt,
                    ownerNotificationRead: row.ownerNotificationRead,
                    preview: (row.message || '').replace(/\s+/g, ' ').trim().slice(0, 180),
                }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        });
    } catch (error) {
        return fail(res, error);
    }
};
export const readGuestSupportNotification = async (req, res) => {
    try {
        const { request, account } = await getSupportAccess(supportCredentials(req));
        if (account.role !== 'guest') throw supportError('forbidden');
        const notificationId = req.body?.notificationId;
        if (typeof notificationId !== 'string' || !notificationId.length || notificationId.length > 100)
            throw supportError('invalidId', 400);
        const result = await SupportRequest.updateOne(
            {
                _id: request._id,
                senderRole: 'guest',
                guestAccessHash: request.guestAccessHash,
                ownerNotificationId: notificationId,
                ownerNotificationRead: false,
            },
            { $set: { ownerNotificationRead: true } },
            { timestamps: false },
        );
        if (result.modifiedCount)
            emitSupport(req.io, supportGuestRoom(request._id), 'guest-support-changed', {
                requestId: String(request._id),
            });
        return res.json({ success: true });
    } catch (error) {
        return fail(res, error);
    }
};
