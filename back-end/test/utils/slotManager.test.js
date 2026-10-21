import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    Doctor: { find: vi.fn(), findByIdAndUpdate: vi.fn() },
    schedule: vi.fn(),
}));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('node-cron', () => ({ default: { schedule: mocks.schedule } }));

import { generateWeeklySlotsForAllDoctors, removeExpiredSlotsForAllDoctors, initSlotGenerationCron } from '../../utils/slotManager.js';

const makeDoctor = (overrides = {}) => ({
    _id: 'doctor-id', availableSchedules: [{ day: 'Thursday', shifts: ['Morning'] }],
    timeSlots: [], save: vi.fn().mockResolvedValue(undefined), ...overrides,
});
const generatedSlots = () => mocks.Doctor.findByIdAndUpdate.mock.calls[0]?.[1].$set.timeSlots;
const runningInUtc = process.env.SLOT_TEST_TZ === 'UTC';
// These timezone-specific failures were reproduced in separate Node processes.
const minuteOfDay = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T10:00:00+07:00'));
    expect(new Date().getTimezoneOffset()).toBe(runningInUtc ? 0 : -420);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.Doctor.find.mockResolvedValue([]);
    mocks.Doctor.findByIdAndUpdate.mockResolvedValue({});
});

describe('generateWeeklySlotsForAllDoctors', () => {
    it.each([
        ['Morning', 7, '08:00', '11:30'],
        ['Afternoon', 6, '13:00', '16:00'],
        ['Evening', 6, '18:00', '21:00'],
    ])('BE-T01: generates %s as %i consecutive thirty-minute slots', async (shift, count, start, end) => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day: 'Thursday', shifts: [shift] }] })]);
        await generateWeeklySlotsForAllDoctors();
        const slots = generatedSlots();
        expect(slots).toHaveLength(count);
        expect(slots[0]).toMatchObject({ day: '2026-10-22', startingTime: start });
        expect(slots.at(-1).endingTime).toBe(end);
        for (let i = 0; i < slots.length; i++) {
            expect(slots[i].day).toBe('2026-10-22');
            expect(minuteOfDay(slots[i].endingTime) - minuteOfDay(slots[i].startingTime)).toBe(30);
            if (i > 0) expect(slots[i].startingTime).toBe(slots[i - 1].endingTime);
        }
    });

    it('BE-T02: ignores an unknown shift without writing slots', async () => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day: 'Thursday', shifts: ['Night'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(mocks.Doctor.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it.each([
        ['Wednesday', '2026-10-28'], ['Tuesday', '2026-10-27'], ['Thursday', '2026-10-22'],
    ])('BE-T03: maps %s to the next occurrence %s', async (day, expected) => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day, shifts: ['Morning'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
        expect(new Set(generatedSlots().map((item) => item.day))).toEqual(new Set([expected]));
    });

    it('BE-T04: ignores an invalid day name', async () => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day: 'NotADay', shifts: ['Morning'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(mocks.Doctor.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it.each([['missing', undefined], ['empty', []]])('BE-T05: skips %s schedules and queries only approved doctors', async (_label, availableSchedules) => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules })]);
        await generateWeeklySlotsForAllDoctors();
        expect(mocks.Doctor.find).toHaveBeenCalledExactlyOnceWith({ isApproved: 'approved' });
        expect(mocks.Doctor.findByIdAndUpdate).not.toHaveBeenCalled();
        // Filtering by approval is checked at the query boundary, not by fake DB filtering.
    });

    it('BE-T06: normalizes shift case and surrounding whitespace', async () => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day: 'Thursday', shifts: [' mOrNiNg '] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
        expect(generatedSlots()[0].startingTime).toBe('08:00');
    });

    it('BE-T07: does not add a slot already present in the doctor document', async () => {
        const existing = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ timeSlots: [existing] })]);
        await generateWeeklySlotsForAllDoctors();
        const slots = generatedSlots();
        expect(slots).toHaveLength(7);
        expect(slots.filter((item) => item.startingTime === '08:00')).toEqual([existing]);
    });

    it('BE-T08: sorts existing slots by date and starting time even with no new valid shift', async () => {
        const slots = [
            { day: '2026-10-24', startingTime: '08:00', endingTime: '08:30' },
            { day: '2026-10-23', startingTime: '09:00', endingTime: '09:30' },
            { day: '2026-10-23', startingTime: '08:00', endingTime: '08:30' },
        ];
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ timeSlots: slots, availableSchedules: [{ day: 'Thursday', shifts: ['Night'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toEqual([slots[2], slots[1], slots[0]]);
        expect(mocks.Doctor.findByIdAndUpdate.mock.calls[0][2]).toEqual({ new: true });
    });

    it('BE-T09: avoids another write when rerun against the previously saved slots', async () => {
        const doctor = makeDoctor();
        mocks.Doctor.find.mockResolvedValue([doctor]);
        mocks.Doctor.findByIdAndUpdate.mockImplementation(async (_id, update) => {
            doctor.timeSlots = update.$set.timeSlots;
            return doctor;
        });
        await generateWeeklySlotsForAllDoctors();
        await generateWeeklySlotsForAllDoctors();
        expect(mocks.Doctor.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(doctor.timeSlots).toHaveLength(7);
    });

    it.each(['duplicate shift', 'duplicate schedule'])('BE-T10 [KNOWN BUG]: removes duplicates from a new batch with %s', async (kind) => {
        const entry = { day: 'Thursday', shifts: ['Morning'] };
        const availableSchedules = kind === 'duplicate shift' ? [{ ...entry, shifts: ['Morning', 'Morning'] }] : [entry, entry];
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
    });

    it.each([
        ['2026-12-31T10:00:00+07:00', 'Friday', '2027-01-01'],
        ['2027-01-31T10:00:00+07:00', 'Monday', '2027-02-01'],
        ['2028-02-28T10:00:00+07:00', 'Tuesday', '2028-02-29'],
    ])('BE-T11: handles the calendar boundary from %s to %s on %s', async (clock, day, expected) => {
        vi.setSystemTime(new Date(clock));
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day, shifts: ['Morning'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
        expect(generatedSlots().every((item) => item.day === expected)).toBe(true);
    });

    it('BE-T11 [KNOWN BUG in Vietnam TZ]: keeps the next Vietnamese day available at 23:30', async () => {
        vi.setSystemTime(new Date('2026-10-21T23:30:00+07:00'));
        mocks.Doctor.find.mockResolvedValue([makeDoctor()]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
        expect(generatedSlots().every((item) => item.day === '2026-10-22')).toBe(true);
    });

    it('BE-T11 [KNOWN BUG in UTC]: handles Vietnamese month rollover at 00:30 on January first', async () => {
        vi.setSystemTime(new Date('2027-01-01T00:30:00+07:00'));
        mocks.Doctor.find.mockResolvedValue([makeDoctor({ availableSchedules: [{ day: 'Saturday', shifts: ['Morning'] }] })]);
        await generateWeeklySlotsForAllDoctors();
        expect(generatedSlots()).toHaveLength(7);
        expect(generatedSlots().every((item) => item.day === '2027-01-02')).toBe(true);
    });

    it.each(['find', 'update'])('BE-T14 [LIMITATION]: logs and swallows the generation %s error', async (stage) => {
        mocks.Doctor.find.mockResolvedValue([makeDoctor()]);
        const error = new Error('database unavailable');
        (stage === 'find' ? mocks.Doctor.find : mocks.Doctor.findByIdAndUpdate).mockRejectedValue(error);
        await expect(generateWeeklySlotsForAllDoctors()).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalledWith('Error in automatic slot generation:', error);
    });
});

describe('removeExpiredSlotsForAllDoctors', () => {
    it('BE-T12: removes yesterday but preserves today and tomorrow, including earlier times today', async () => {
        const slots = ['2026-10-20', '2026-10-21', '2026-10-22'].map((day) => ({ day, startingTime: '08:00', endingTime: '08:30' }));
        const doctor = makeDoctor({ timeSlots: slots });
        mocks.Doctor.find.mockResolvedValue([doctor]);
        await removeExpiredSlotsForAllDoctors();
        expect(mocks.Doctor.find).toHaveBeenCalledWith({ isApproved: 'approved' });
        expect(doctor.timeSlots).toEqual(slots.slice(1));
        expect(doctor.save).toHaveBeenCalledTimes(1);
    });

    it('BE-T12 [KNOWN BUG in UTC]: removes the previous Vietnamese day at 00:30 regardless of server timezone', async () => {
        vi.setSystemTime(new Date('2026-10-21T00:30:00+07:00'));
        const today = { day: '2026-10-21', startingTime: '08:00', endingTime: '08:30' };
        const doctor = makeDoctor({ timeSlots: [{ ...today, day: '2026-10-20' }, today] });
        mocks.Doctor.find.mockResolvedValue([doctor]);
        await removeExpiredSlotsForAllDoctors();
        expect(doctor.timeSlots).toEqual([today]);
        expect(doctor.save).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['missing', undefined], ['empty', []],
        ['future-only', [{ day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' }]],
    ])(
        'BE-T13: does not save for %s slots without expired entries', async (_label, timeSlots) => {
            const doctor = makeDoctor({ timeSlots });
            mocks.Doctor.find.mockResolvedValue([doctor]);
            await removeExpiredSlotsForAllDoctors();
            expect(doctor.save).not.toHaveBeenCalled();
        },
    );

    it.each(['find', 'save'])('BE-T14 [LIMITATION]: logs and swallows the cleanup %s error', async (stage) => {
        const doctor = makeDoctor({ timeSlots: [{ day: '2026-10-20' }] });
        mocks.Doctor.find.mockResolvedValue([doctor]);
        const error = new Error('database unavailable');
        (stage === 'find' ? mocks.Doctor.find : doctor.save).mockRejectedValue(error);
        await expect(removeExpiredSlotsForAllDoctors()).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalledWith('Error removing expired slots:', error);
    });
});

describe('initSlotGenerationCron', () => {
    it('BE-T15: schedules midnight in Vietnam and completes cleanup before generating new slots', async () => {
        const doctor = makeDoctor({ timeSlots: [{ day: '2026-10-20', startingTime: '08:00', endingTime: '08:30' }] });
        mocks.Doctor.find.mockResolvedValue([doctor]);
        let finishCleanup;
        doctor.save.mockImplementation(() => new Promise((resolve) => { finishCleanup = resolve; }));
        initSlotGenerationCron();
        expect(mocks.schedule).toHaveBeenCalledExactlyOnceWith('0 0 * * *', expect.any(Function), { timezone: 'Asia/Ho_Chi_Minh' });
        const pending = mocks.schedule.mock.calls[0][1]();
        await Promise.resolve();
        expect(doctor.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.find).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.findByIdAndUpdate).not.toHaveBeenCalled();
        finishCleanup();
        await pending;
        expect(mocks.Doctor.find).toHaveBeenCalledTimes(2);
        expect(mocks.Doctor.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(doctor.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.Doctor.findByIdAndUpdate.mock.invocationCallOrder[0]);
    });
});
