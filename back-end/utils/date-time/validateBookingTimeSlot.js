// Slots use the clinic's calendar date in Vietnam, regardless of the server timezone.
export const getBookingTimeSlotError = (slot) => {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot) ||
        !slot.day || !slot.startingTime || !slot.endingTime) {
        return 'Invalid time slot: day, startingTime, and endingTime are required';
    }

    const { day, startingTime, endingTime } = slot;
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
        typeof startingTime !== 'string' || !timePattern.test(startingTime) ||
        typeof endingTime !== 'string' || !timePattern.test(endingTime)) {
        return 'Invalid time slot: use YYYY-MM-DD and HH:mm';
    }

    const date = new Date(`${day}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
        return 'Invalid time slot: date does not exist';
    }
    if (startingTime >= endingTime) return 'Starting time must be earlier than ending time';

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (day < today) return 'Date must be in the future';
    return null;
};

export const isSameBookingTimeSlot = (left, right) =>
    left?.day === right?.day &&
    left?.startingTime === right?.startingTime &&
    left?.endingTime === right?.endingTime;
