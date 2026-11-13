import {
    emitSupport,
    SUPPORT_ADMIN_ROOM,
    supportRequestRoom,
    hasSupportOwner,
    emitOwnerSupportNotification,
} from '../utils/supportRealtime.js';
import mongoose from 'mongoose';
import SupportRequest, { supportStatuses } from '../Models/SupportRequestSchema.js';
import User from '../Models/UserSchema.js';

const validId = (id) => typeof id === 'string' && mongoose.isObjectIdOrHexString(id);
const fail = (res, status, code) => res.status(status).json({ success: false, code });
const serialize = (doc, adminId) => {
    const { readBy = [], submissionIp, guestAccessHash, ...data } = doc;
    return { ...data, isRead: readBy.some((id) => String(id) === String(adminId)) };
};
const dateBoundary = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T00:00:00+07:00');
    return Number.isNaN(date.getTime()) || new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10) !== value
        ? null
        : date;
};

export const listSupportRequests = async (req, res) => {
    const { status, q = '', from, to, page = '1', limit = '10' } = req.query;
    if (
        typeof q !== 'string' ||
        q.length > 200 ||
        (status && !supportStatuses.includes(status)) ||
        !/^\d+$/.test(String(page)) ||
        !/^\d+$/.test(String(limit))
    )
        return fail(res, 400, 'invalidFilters');
    const pageNumber = Number(page),
        pageSize = Number(limit);
    if (
        !Number.isSafeInteger(pageNumber) ||
        pageNumber < 1 ||
        pageNumber > 100000 ||
        !Number.isSafeInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 50
    )
        return fail(res, 400, 'invalidFilters');
    const start = from ? dateBoundary(from) : null,
        end = to ? dateBoundary(to) : null;
    if ((from && !start) || (to && !end) || (start && end && start > end)) return fail(res, 400, 'invalidFilters');
    const filter = {};
    if (status) filter.status = status;
    if (start || end) {
        filter.createdAt = {};
        if (start) filter.createdAt.$gte = start;
        if (end) filter.createdAt.$lt = new Date(end.getTime() + 86400000);
    }
    const search = q.trim();
    if (search) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ fullname: regex }, { email: regex }, { subject: regex }];
        if (validId(search)) filter.$or.push({ _id: search });
    }
    try {
        const [documents, total] = await Promise.all([
            SupportRequest.find(filter)
                .select('-message -history')
                .sort({ createdAt: -1, _id: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            SupportRequest.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            data: documents.map((doc) => serialize(doc, req.userId)),
            total,
            page: pageNumber,
            limit: pageSize,
        });
    } catch {
        return fail(res, 500, 'loadFailed');
    }
};

export const getSupportRequest = async (req, res) => {
    if (!validId(req.params.id)) return fail(res, 400, 'invalidId');
    try {
        const document = await SupportRequest.findById(req.params.id).lean();
        if (!document) return fail(res, 404, 'notFound');
        return res.json({ success: true, data: serialize(document, req.userId) });
    } catch {
        return fail(res, 500, 'loadFailed');
    }
};

export const readSupportRequest = async (req, res) => {
    if (!validId(req.params.id)) return fail(res, 400, 'invalidId');
    try {
        const document = await SupportRequest.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { readBy: req.userId } },
            { new: true, timestamps: false },
        ).lean();
        if (!document) return fail(res, 404, 'notFound');
        emitSupport(req.io, SUPPORT_ADMIN_ROOM, 'support-requests-changed', {
            requestId: req.params.id,
            reason: 'read',
        });
        return res.json({ success: true, data: serialize(document, req.userId) });
    } catch {
        return fail(res, 500, 'loadFailed');
    }
};

export const updateSupportRequest = async (req, res) => {
    if (!validId(req.params.id)) return fail(res, 400, 'invalidId');
    const { version, status, note, assignment } = req.body || {};
    if (
        !Number.isSafeInteger(version) ||
        version < 0 ||
        (status !== undefined && !supportStatuses.includes(status)) ||
        (note !== undefined && (typeof note !== 'string' || !note.trim() || note.trim().length > 2000)) ||
        (assignment !== undefined && !['claim', 'release'].includes(assignment)) ||
        (status === undefined && note === undefined && assignment === undefined)
    )
        return fail(res, 400, 'invalidUpdate');
    try {
        const document = await SupportRequest.findById(req.params.id).lean();
        if (!document) return fail(res, 404, 'notFound');
        if (document.__v !== version) return fail(res, 409, 'conflict');
        const admin = await User.findById(req.userId).select('fullname').lean();
        if (!admin) return fail(res, 403, 'forbidden');
        const actorId = req.userId,
            actorName = admin.fullname;
        const ownAssignment = String(document.assignee?.id || '') === String(actorId);
        if (assignment && document.assignee?.id && !ownAssignment) return fail(res, 409, 'alreadyAssigned');
        const changes = {},
            history = [];
        const entry = (type, fields = {}) => ({ type, actorId, actorName, at: new Date(), ...fields });
        if (status !== undefined && status !== document.status) {
            changes.status = status;
            history.push(entry('status', { from: document.status, to: status }));
        }
        if (note !== undefined) history.push(entry('note', { note: note.trim() }));
        if (assignment === 'claim' && !ownAssignment) {
            changes.assignee = { id: actorId, fullname: actorName };
            history.push(entry('claim'));
        } else if (assignment === 'release' && ownAssignment) {
            changes.assignee = null;
            history.push(entry('release'));
        }
        if (changes.status && hasSupportOwner(document)) {
            Object.assign(changes, {
                ownerNotificationId: 'status:' + new mongoose.Types.ObjectId(),
                ownerNotificationActorId: actorId,
                ownerNotificationAt: new Date(),
                ownerNotificationKind: 'status',
                ownerNotificationStatus: changes.status,
                ownerNotificationRead: false,
            });
        }
        if (!history.length) return res.json({ success: true, data: serialize(document, actorId) });
        const updated = await SupportRequest.findOneAndUpdate(
            { _id: req.params.id, __v: version },
            {
                $set: changes,
                $inc: { __v: 1 },
                $push: { history: { $each: history } },
            },
            { new: true, runValidators: true },
        ).lean();
        if (!updated) return fail(res, 409, 'conflict');
        if (changes.status) await emitOwnerSupportNotification(req.io, updated);
        emitSupport(req.io, SUPPORT_ADMIN_ROOM, 'support-requests-changed', {
            requestId: req.params.id,
            reason: 'updated',
        });
        emitSupport(req.io, supportRequestRoom(req.params.id), 'support-chat-changed', { requestId: req.params.id });
        return res.json({ success: true, data: serialize(updated, actorId) });
    } catch {
        return fail(res, 500, 'saveFailed');
    }
};
