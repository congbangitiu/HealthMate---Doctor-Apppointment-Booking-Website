import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';

export const SUPPORT_ADMIN_ROOM = 'support:admins';
export const supportRequestRoom = (id) => 'support:request:' + id;
export const supportNotification = (request) => ({
    id: request.notificationId || 'created:' + request._id,
    requestId: String(request._id),
    fullname: request.fullname,
    senderRole: request.senderRole || 'guest',
    photo: request.senderPhoto || '',
    requestCreatedAt: request.createdAt,
    category: request.category,
    subject: request.subject || '',
    kind: request.notificationKind || 'request',
    createdAt: request.notificationAt || request.createdAt,
    isRead: false,
});
export const emitSupport = (io, room, event, payload) => {
    try {
        io?.to(room).emit(event, payload);
    } catch {
        /* Database writes are authoritative; reconnect and polling recover delivery. */
    }
};

// Resolve current account avatars in batches; contact names remain the submitted snapshot.
export const withSupportSenderPhotos = async (requests) => {
    const load = async (Model, roles) => {
        const ids = [...new Set(requests.filter((r) => r.senderId && roles.includes(r.senderRole)).map((r) => String(r.senderId)))];
        if (!ids.length) return [];
        try { return await Model.find({ _id: { $in: ids } }).select('photo').lean(); }
        catch { return []; }
    };
    const [users, doctors] = await Promise.all([load(User, ['patient', 'admin']), load(Doctor, ['doctor'])]);
    const userPhotos = new Map(users.map((u) => [String(u._id), u.photo]));
    const doctorPhotos = new Map(doctors.map((u) => [String(u._id), u.photo]));
    return requests.map((r) => ({ ...r, senderPhoto: (r.senderRole === 'doctor' ? doctorPhotos : userPhotos).get(String(r.senderId)) || '' }));
};
export const emitSupportNotification = async (io, request) => {
    try {
        const plain = typeof request.toObject === 'function' ? request.toObject() : request;
        const [enriched] = await withSupportSenderPhotos([plain]);
        emitSupport(io, SUPPORT_ADMIN_ROOM, 'support-notification', supportNotification(enriched));
    } catch { /* Notification failures never undo a committed request or message. */ }
};
