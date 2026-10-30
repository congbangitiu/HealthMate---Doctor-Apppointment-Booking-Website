import mongoose from 'mongoose';
import Booking from '../Models/BookingSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import { sameId } from '../auth/sameId.js';
import { getBookingTimeSlotError, isSameBookingTimeSlot } from '../utils/date-time/validateBookingTimeSlot.js';

const future = (slot) => new Date(`${slot.day}T${slot.startingTime}:00+07:00`).getTime() > Date.now();
const duration = (slot) => {
    const value = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    return value(slot.endingTime) - value(slot.startingTime);
};
const fail = (status, code) => {
    throw Object.assign(new Error(code), { status, code });
};

// Invalidation contains no patient information. Clients refetch their authenticated scope.
export const invalidateAppointments = (io, booking) => {
    if (!booking) return;
    const id = (entity) => String(entity?._id || entity);
    try {
        io?.in?.([`calendar:doctor:${id(booking.doctor)}`, `calendar:patient:${id(booking.user)}`]).emit(
            'appointments-changed',
        );
    } catch {
        // Reconnect/focus/periodic refetch recovers a missed notification. The write already committed.
    }
};

export const scheduleNotification = (booking, entry) => ({
    id: `reschedule-${booking._id}-${entry._id}`,
    appointmentId: booking._id,
    doctor: {
        _id: booking.doctor?._id || booking.doctor,
        fullname: booking.doctor?.fullname || entry.actorName,
        photo: booking.doctor?.photo,
    },
    type: 'reschedule',
    from: entry.from,
    timeSlot: entry.to,
    reason: entry.reason,
    createdAt: entry.timestamp,
});

export const getScheduleNotifications = async (req, res) => {
    if (!req.userId || req.userRole !== 'patient') return res.status(403).json({ code: 'FORBIDDEN' });
    try {
        const bookings = await Booking.find({ user: req.userId, 'scheduleHistory.0': { $exists: true } });
        const entries = bookings.flatMap((booking) => booking.scheduleHistory.map((entry) => ({ booking, entry })));
        const notifications = entries.sort((a, b) => new Date(b.entry.timestamp) - new Date(a.entry.timestamp))
            .slice(0, 6).map(({ booking, entry }) => scheduleNotification(booking, entry));
        return res.json({ data: notifications, unreadCount: entries.filter(({ entry }) => entry.patientUnread).length });
    } catch {
        return res.status(500).json({ code: 'LOAD_FAILED' });
    }
};

export const markScheduleNotificationsRead = async (req, res) => {
    if (!req.userId || req.userRole !== 'patient') return res.status(403).json({ code: 'FORBIDDEN' });
    const before = req.body?.before ? new Date(req.body.before) : new Date();
    if (!Number.isFinite(before.getTime()) || before > new Date()) return res.status(400).json({ code: 'INVALID_REQUEST' });
    try {
        await Booking.updateMany(
            { user: req.userId, 'scheduleHistory.patientUnread': true },
            { $set: { 'scheduleHistory.$[entry].patientUnread': false } },
            { arrayFilters: [{ 'entry.patientUnread': true, 'entry.timestamp': { $lte: before } }] },
        );
        return res.json({ success: true });
    } catch {
        return res.status(500).json({ code: 'SAVE_FAILED' });
    }
};

export const getCalendarAvailability = async (req, res) => {
    if (!req.userId || req.userRole !== 'doctor') return res.status(403).json({ code: 'FORBIDDEN' });
    try {
        const doctor = await Doctor.findById(req.userId).select('timeSlots');
        if (!doctor) return res.status(404).json({ code: 'NOT_FOUND' });
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        const booked = await Booking.find({
            doctor: req.userId,
            status: { $ne: 'cancelled' },
            'timeSlot.day': { $gte: today },
        });
        const slots = doctor.timeSlots.filter(
            (slot) =>
                future(slot) &&
                !booked.some(
                    ({ timeSlot }) =>
                        timeSlot?.day === slot.day &&
                        timeSlot.startingTime < slot.endingTime &&
                        timeSlot.endingTime > slot.startingTime,
                ),
        );
        return res.json({ data: slots });
    } catch {
        return res.status(500).json({ code: 'LOAD_FAILED' });
    }
};

export const rescheduleAppointment = async (req, res) => {
    if (!req.userId || req.userRole !== 'doctor') return res.status(403).json({ code: 'FORBIDDEN' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ code: 'INVALID_REQUEST' });
    const { timeSlot, expectedVersion, reason } = req.body || {};
    if (
        getBookingTimeSlotError(timeSlot) ||
        !future(timeSlot) ||
        !Number.isSafeInteger(expectedVersion) ||
        expectedVersion < 0 ||
        typeof reason !== 'string' ||
        !reason.trim() ||
        reason.length > 500
    ) {
        return res.status(400).json({ code: 'INVALID_REQUEST' });
    }
    const target = { day: timeSlot.day, startingTime: timeSlot.startingTime, endingTime: timeSlot.endingTime };
    let session;
    let updated;
    let scheduleChange;
    try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const booking = await Booking.findById(req.params.id).session(session);
            if (!booking) fail(404, 'NOT_FOUND');
            if (!sameId(booking.doctor, req.userId)) fail(403, 'FORBIDDEN');
            if ((booking.scheduleVersion || 0) !== expectedVersion) fail(409, 'STALE_APPOINTMENT');
            // Follow-up PDFs refer to the original schedule; they need a separate document reissue flow.
            if (booking.status !== 'pending' || booking.isReExamination || !future(booking.timeSlot))
                fail(409, 'NOT_EDITABLE');
            if (duration(target) !== duration(booking.timeSlot) || isSameBookingTimeSlot(target, booking.timeSlot))
                fail(400, 'INVALID_REQUEST');

            const overlap = await Booking.findOne({
                _id: { $ne: booking._id },
                status: { $ne: 'cancelled' },
                'timeSlot.day': target.day,
                'timeSlot.startingTime': { $lt: target.endingTime },
                'timeSlot.endingTime': { $gt: target.startingTime },
                $or: [{ doctor: req.userId }, { user: booking.user._id || booking.user }],
            }).session(session);
            if (overlap) fail(409, 'SLOT_UNAVAILABLE');

            // A conditional claim plus transaction prevents two reschedules consuming the same slot.
            const doctor = await Doctor.findOneAndUpdate(
                { _id: req.userId, timeSlots: { $elemMatch: target } },
                { $pull: { timeSlots: target } },
                { new: true, session },
            );
            if (!doctor) fail(409, 'SLOT_UNAVAILABLE');
            const from = {
                day: booking.timeSlot.day,
                startingTime: booking.timeSlot.startingTime,
                endingTime: booking.timeSlot.endingTime,
            };
            const versionFilter =
                expectedVersion === 0
                    ? { $or: [{ scheduleVersion: 0 }, { scheduleVersion: { $exists: false } }] }
                    : { scheduleVersion: expectedVersion };
            scheduleChange = {
                _id: new mongoose.Types.ObjectId(),
                from,
                to: target,
                actorId: req.userId,
                actorName: doctor.fullname,
                actorRole: 'doctor',
                reason: reason.trim(),
                timestamp: new Date(),
                patientUnread: true,
            };
            updated = await Booking.findOneAndUpdate(
                { _id: booking._id, status: 'pending', ...versionFilter },
                {
                    $set: { timeSlot: target },
                    $inc: { scheduleVersion: 1 },
                    $push: {
                        scheduleHistory: scheduleChange,
                    },
                },
                { new: true, runValidators: true, session },
            );
            if (!updated) fail(409, 'STALE_APPOINTMENT');
            await Doctor.updateOne({ _id: req.userId }, { $addToSet: { timeSlots: from } }, { session });
        });
        try {
            req.io?.to(String(updated.user?._id || updated.user)).emit(
                'reschedule-notification', scheduleNotification(updated, scheduleChange),
            );
        } catch {
            // The saved history is returned by the notifications API after reconnect.
        }
        invalidateAppointments(req.io, updated);
        return res.json({ success: true, data: updated });
    } catch (error) {
        // Never fall back to partial writes on standalone MongoDB.
        const unsupported =
            error.code === 20 || /Transaction numbers are only allowed|replica set/i.test(error.message);
        return res.status(unsupported ? 503 : error.status || 500).json({
            success: false,
            code: unsupported ? 'TRANSACTIONS_REQUIRED' : error.status ? error.code : 'SAVE_FAILED',
        });
    } finally {
        if (session) await session.endSession();
    }
};
