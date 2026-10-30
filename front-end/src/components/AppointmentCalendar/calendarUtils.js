// Calendar dates are clinic dates in Vietnam, independent of the viewer's timezone.
export const clinicToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

export const validDay = (day) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return false;
    const date = new Date(`${day}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day;
};

export const addDays = (day, amount) => {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
};

export const visibleDays = (day, mode) => {
    if (mode === 'day') return [day];
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const monday = addDays(day, -((weekday + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

export const minutes = (time) => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
};
export const clock = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
export const slotKey = (slot) => `${slot.day}|${slot.startingTime}|${slot.endingTime}`;
export const isFutureSlot = (slot) => new Date(`${slot.day}T${slot.startingTime}:00+07:00`).getTime() > Date.now();
export const entityId = (entity) => String(entity?._id || entity || '');

// Connected overlapping events share columns; none are painted over another event.
export const layoutEvents = (appointments) => {
    const sorted = appointments
        .filter((item) => item.timeSlot?.startingTime && item.timeSlot?.endingTime)
        .map((appointment) => ({
            appointment,
            start: minutes(appointment.timeSlot.startingTime),
            end: minutes(appointment.timeSlot.endingTime),
        }))
        .sort((a, b) => a.start - b.start || a.end - b.end);
    const result = [];
    let group = [];
    let ends = [];
    let groupEnd = -1;
    const flush = () => group.forEach((event) => result.push({ ...event, columns: ends.length }));
    for (const event of sorted) {
        if (event.start >= groupEnd) {
            flush();
            group = [];
            ends = [];
        }
        let column = ends.findIndex((end) => end <= event.start);
        if (column === -1) column = ends.length;
        ends[column] = event.end;
        group.push({ ...event, column });
        groupEnd = Math.max(...group.map((item) => item.end));
    }
    flush();
    return result;
};
