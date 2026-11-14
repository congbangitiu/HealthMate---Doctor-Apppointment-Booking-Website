import SupportRequest from '../Models/SupportRequestSchema.js';
import { supportNotification, withSupportSenderPhotos } from '../utils/supportRealtime.js';

export const getSupportNotifications = async (req, res) => {
    try {
        const [items, unreadCount] = await Promise.all([
            SupportRequest.find({}).select('senderId senderRole fullname category subject createdAt notificationAt notificationId notificationKind readBy')
                .sort({ notificationAt: -1, createdAt: -1, _id: -1 }).limit(12).lean(),
            SupportRequest.countDocuments({ readBy: { $ne: req.userId } }),
        ]);
        return res.json({ success: true, data: (await withSupportSenderPhotos(items)).map((item) => ({
            ...supportNotification(item), isRead: (item.readBy || []).some((id) => String(id) === String(req.userId)),
        })), unreadCount });
    } catch { return res.status(500).json({ success: false, code: 'loadFailed' }); }
};
