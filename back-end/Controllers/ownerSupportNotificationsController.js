import mongoose from 'mongoose';
import SupportRequest from '../Models/SupportRequestSchema.js';
import { getSupportAccount, supportCredentials, supportError } from '../utils/supportAccess.js';
import {
    ownerSupportNotification,
    supportOwnerRoom,
    emitSupport,
    withOwnerSupportActors,
} from '../utils/supportRealtime.js';
const owner = async (req) => {
    const account = await getSupportAccount(supportCredentials(req).token);
    if (!['patient', 'doctor'].includes(account.role)) throw supportError('forbidden');
    return account;
};
const fail = (res, error) => res.status(error.status || 500).json({ success: false, code: error.code || 'loadFailed' });
export const getOwnerSupportNotifications = async (req, res) => {
    try {
        const account = await owner(req);
        const filter = { senderId: account.id, senderRole: account.role, ownerNotificationId: { $exists: true } };
        const [rows, unreadCount] = await Promise.all([
            SupportRequest.find(filter)
                .select(
                    'history ownerNotificationActorId category subject ownerNotificationId ownerNotificationAt ownerNotificationKind ownerNotificationStatus ownerNotificationRead',
                )
                .sort({ ownerNotificationAt: -1, _id: -1 })
                .limit(12)
                .lean(),
            SupportRequest.countDocuments({ ...filter, ownerNotificationRead: false }),
        ]);
        return res.json({
            success: true,
            data: (await withOwnerSupportActors(rows)).map(ownerSupportNotification),
            unreadCount,
        });
    } catch (error) {
        return fail(res, error);
    }
};
export const readOwnerSupportNotification = async (req, res) => {
    try {
        const account = await owner(req);
        const { requestId, notificationId } = req.body || {};
        if (
            !mongoose.isObjectIdOrHexString(requestId) ||
            typeof notificationId !== 'string' ||
            notificationId.length > 100
        )
            return res.status(400).json({ success: false, code: 'invalidId' });
        // Match the exact version seen: an older tab cannot clear a newer notification.
        const result = await SupportRequest.updateOne(
            {
                _id: requestId,
                senderId: account.id,
                senderRole: account.role,
                ownerNotificationId: notificationId,
                ownerNotificationRead: false,
            },
            { $set: { ownerNotificationRead: true } },
            { timestamps: false },
        );
        if (result.modifiedCount)
            emitSupport(req.io, supportOwnerRoom(account.role, account.id), 'owner-support-changed', { requestId });
        return res.json({ success: true });
    } catch (error) {
        return fail(res, error);
    }
};
