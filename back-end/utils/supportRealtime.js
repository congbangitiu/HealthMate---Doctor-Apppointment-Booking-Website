import SupportMessage from '../Models/SupportMessageSchema.js';
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
        const ids = [
            ...new Set(
                requests.filter((r) => r.senderId && roles.includes(r.senderRole)).map((r) => String(r.senderId)),
            ),
        ];
        if (!ids.length) return [];
        try {
            return await Model.find({ _id: { $in: ids } })
                .select('photo')
                .lean();
        } catch {
            return [];
        }
    };
    const [users, doctors] = await Promise.all([load(User, ['patient', 'admin']), load(Doctor, ['doctor'])]);
    const userPhotos = new Map(users.map((u) => [String(u._id), u.photo]));
    const doctorPhotos = new Map(doctors.map((u) => [String(u._id), u.photo]));
    return requests.map((r) => ({
        ...r,
        senderPhoto: (r.senderRole === 'doctor' ? doctorPhotos : userPhotos).get(String(r.senderId)) || '',
    }));
};
export const emitSupportNotification = async (io, request) => {
    try {
        const plain = typeof request.toObject === 'function' ? request.toObject() : request;
        const [enriched] = await withSupportSenderPhotos([plain]);
        emitSupport(io, SUPPORT_ADMIN_ROOM, 'support-notification', supportNotification(enriched));
    } catch {
        /* Notification failures never undo a committed request or message. */
    }
};

export const supportOwnerRoom = (role, id) => 'support:owner:' + role + ':' + id;
export const hasSupportOwner = (request) =>
    Boolean(request.senderId && ['patient', 'doctor'].includes(request.senderRole));
export const ownerSupportNotification = (request) => ({
    id: request.ownerNotificationId,
    requestId: String(request._id),
    type: 'support-update',
    actorName: request.ownerActorName || '',
    photo: request.ownerActorPhoto || '',
    category: request.category,
    subject: request.subject || '',
    kind: request.ownerNotificationKind,
    supportStatus: request.ownerNotificationStatus,
    createdAt: request.ownerNotificationAt,
    isRead: request.ownerNotificationRead !== false,
});
// Older notifications can recover their actor from status history or the persisted reply.
export const withOwnerSupportActors = async (requests) => {
    const messageIds = requests
        .filter((r) => !r.ownerNotificationActorId && r.ownerNotificationKind === 'message')
        .map((r) => r.ownerNotificationId?.replace(/^message:/, ''))
        .filter((id) => /^[a-f0-9]{24}$/i.test(id || ''));
    let messages = [];
    if (messageIds.length) {
        try {
            messages = await SupportMessage.find({ _id: { $in: messageIds }, senderRole: 'admin' })
                .select('senderId')
                .lean();
        } catch {
            /* Avatar lookup must not affect notification delivery. */
        }
    }
    const messageActors = new Map(messages.map((m) => [String(m._id), m.senderId]));
    const actorId = (r) =>
        r.ownerNotificationActorId ||
        (r.ownerNotificationKind === 'status'
            ? [...(r.history || [])].reverse().find((entry) => entry.type === 'status')?.actorId
            : messageActors.get(r.ownerNotificationId?.replace(/^message:/, '')));
    const ids = [...new Set(requests.map(actorId).filter(Boolean).map(String))];
    let admins = [];
    if (ids.length) {
        try {
            admins = await User.find({ _id: { $in: ids }, role: 'admin' })
                .select('fullname photo')
                .lean();
        } catch {
            /* Keep a neutral fallback when account media is unavailable. */
        }
    }
    const byId = new Map(admins.map((admin) => [String(admin._id), admin]));
    return requests.map((r) => ({
        ...r,
        ownerActorName: byId.get(String(actorId(r)))?.fullname || '',
        ownerActorPhoto: byId.get(String(actorId(r)))?.photo || '',
    }));
};
export const emitOwnerSupportNotification = async (io, request) => {
    if (!hasSupportOwner(request) || !request.ownerNotificationId) return;
    let enriched = request;
    try {
        [enriched] = await withOwnerSupportActors([request]);
    } catch {
        /* Account media cannot change the success of the saved update. */
    }
    emitSupport(
        io,
        supportOwnerRoom(request.senderRole, request.senderId),
        'owner-support-notification',
        ownerSupportNotification(enriched),
    );
};
