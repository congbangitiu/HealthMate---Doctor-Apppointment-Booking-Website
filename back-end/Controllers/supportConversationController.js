import mongoose from 'mongoose';
import SupportRequest from '../Models/SupportRequestSchema.js';
import SupportMessage from '../Models/SupportMessageSchema.js';
import {
    getSupportAccess,
    getSupportAccount,
    supportCredentials,
    publicSupportRequest,
} from '../utils/supportAccess.js';
import {
    supportRequestRoom,
    emitSupport,
    emitSupportNotification,
    hasSupportOwner,
    emitOwnerSupportNotification,
} from '../utils/supportRealtime.js';

const reject = (res, error) =>
    res.status(error.status || 500).json({ success: false, code: error.code || 'chatFailed' });
export const ownSupportRequests = async (req, res) => {
    try {
        const account = await getSupportAccount(supportCredentials(req).token);
        const requests = await SupportRequest.find({ senderId: account.id, senderRole: account.role })
            .select('category subject fullname message status createdAt ownerNotificationAt ownerNotificationRead')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return res.json({ success: true, data: requests.map(({ message, ...item }) => ({
            ...item, preview: (message || '').replace(/\s+/g, ' ').trim().slice(0, 180),
        })) });
    } catch (error) {
        return reject(res, error);
    }
};
export const getSupportConversation = async (req, res) => {
    try {
        const { request, account } = await getSupportAccess(supportCredentials(req));
        const filter = { request: request._id };
        const after = req.query.after;
        if (after && req.query.before) return res.status(400).json({ code: 'invalidId' });
        if (req.query.before) {
            if (!mongoose.isObjectIdOrHexString(req.query.before)) return res.status(400).json({ code: 'invalidId' });
            filter._id = { $lt: req.query.before };
        }
        if (after) {
            if (!mongoose.isObjectIdOrHexString(after)) return res.status(400).json({ code: 'invalidId' });
            filter._id = { $gt: after };
        }
        const messages = await SupportMessage.find(filter)
            .sort({ _id: after ? 1 : -1 })
            .limit(51)
            .lean();
        const hasMore = messages.length > 50;
        return res.json({
            success: true,
            data: {
                request: publicSupportRequest(request),
                messages: after ? messages.slice(0, 50) : messages.slice(0, 50).reverse(),
                hasMore,
                viewer: { id: account.id, role: account.role },
            },
        });
    } catch (error) {
        return reject(res, error);
    }
};
export const sendSupportMessage = async (req, res) => {
    const { content, clientId } = req.body || {};
    if (
        typeof content !== 'string' ||
        !content.trim() ||
        content.trim().length > 3000 ||
        typeof clientId !== 'string' ||
        !/^[a-zA-Z0-9-]{16,80}$/.test(clientId)
    ) {
        return res.status(400).json({ success: false, code: 'invalidMessage' });
    }
    try {
        const { request, account, senderKey } = await getSupportAccess(supportCredentials(req));
        const key = { request: request._id, senderKey, clientId };
        let message = await SupportMessage.findOne(key).lean();
        let created = false;
        if (!message) {
            const recent = await SupportMessage.countDocuments({
                request: request._id,
                senderKey,
                createdAt: { $gte: new Date(Date.now() - 60000) },
            });
            if (recent >= 30) return res.status(429).json({ success: false, code: 'rateLimited' });
            try {
                const saved = await SupportMessage.create({
                    ...key,
                    senderId: account.id,
                    senderRole: account.role,
                    senderName: account.fullname,
                    content: content.trim(),
                });
                message = saved.toObject();
                created = true;
            } catch (error) {
                if (error.code !== 11000) throw error;
                message = await SupportMessage.findOne(key).lean();
                if (!message) throw error;
            }
        }
        // A persisted message stays successful even if ancillary notification work fails.
        if (created) {
            if (account.role !== 'admin') {
                try {
                    const updated = await SupportRequest.findByIdAndUpdate(
                        request._id,
                        {
                            $set: {
                                readBy: [],
                                notificationAt: message.createdAt,
                                notificationId: 'message:' + message._id,
                                notificationKind: 'message',
                            },
                        },
                        { new: true },
                    ).lean();
                    if (updated) await emitSupportNotification(req.io, updated);
                } catch {
                    /* Message history remains available on reconnect. */
                }
            } else if (hasSupportOwner(request)) {
                try {
                    const updated = await SupportRequest.findByIdAndUpdate(
                        request._id,
                        {
                            $set: {
                                ownerNotificationId: 'message:' + message._id,
                                ownerNotificationActorId: account.id,
                                ownerNotificationAt: message.createdAt,
                                ownerNotificationKind: 'message',
                                ownerNotificationRead: false,
                            },
                        },
                        { new: true },
                    ).lean();
                    if (updated) await emitOwnerSupportNotification(req.io, updated);
                } catch {
                    /* The persisted reply stays successful; conversation history remains available. */
                }
            }
            emitSupport(req.io, supportRequestRoom(request._id), 'support-chat-changed', {
                requestId: String(request._id),
                messageId: String(message._id),
            });
        }
        const { senderKey: privateKey, ...safeMessage } = message;
        return res.status(created ? 201 : 200).json({ success: true, data: safeMessage });
    } catch (error) {
        return reject(res, error);
    }
};
