import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBookingTimeSlotError, isSameBookingTimeSlot } from '../../utils/date-time/validateBookingTimeSlot.js';

const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T10:00:00+07:00'));
});

describe('getBookingTimeSlotError', () => {
    it.each([
        undefined, null, [], 'invalid', {},
        { ...slot, day: '' }, { ...slot, startingTime: '' }, { ...slot, endingTime: '' },
        { ...slot, day: 20261022 }, { ...slot, startingTime: 800 },
        { ...slot, day: '2026-2-22' }, { ...slot, day: '2026-02-30' },
        { ...slot, day: '2026-13-01' }, { ...slot, day: '2027-02-29' },
        { ...slot, startingTime: '8:00' }, { ...slot, startingTime: '24:00' },
        { ...slot, startingTime: '08:60' }, { ...slot, endingTime: '08:30:00' },
        { ...slot, endingTime: '08:00' }, { ...slot, endingTime: '07:30' },
        { ...slot, day: '2026-10-20' },
    ])('rejects invalid slot %j', (invalidSlot) => {
        expect(getBookingTimeSlotError(invalidSlot)).toEqual(expect.any(String));
    });

    it.each([
        slot,
        { ...slot, day: '2028-02-29' },
        { ...slot, startingTime: '00:00', endingTime: '23:59' },
        // Existing behavior allows today's slots; no new cutoff by starting hour is imposed.
        { ...slot, day: '2026-10-21' },
    ])('accepts valid slot %j', (validSlot) => {
        const before = { ...validSlot };
        expect(getBookingTimeSlotError(validSlot)).toBeNull();
        expect(validSlot).toEqual(before);
    });

    it.each([
        ['2026-10-21T16:59:59.999Z', '2026-10-21', true],
        ['2026-10-21T17:00:00.000Z', '2026-10-21', false],
        ['2026-10-21T17:00:00.000Z', '2026-10-22', true],
    ])('uses the Vietnam calendar at %s for slot date %s', (now, day, valid) => {
        vi.setSystemTime(new Date(now));
        expect(getBookingTimeSlotError({ ...slot, day }) === null).toBe(valid);
    });
});

describe('isSameBookingTimeSlot', () => {
    it('compares slot values rather than object identity or extra fields', () => {
        expect(isSameBookingTimeSlot(slot, { ...slot, _id: 'subdocument-id' })).toBe(true);
    });

    it.each([
        ['day', '2026-10-23'], ['startingTime', '08:01'], ['endingTime', '08:31'],
    ])('requires matching %s', (field, value) => {
        expect(isSameBookingTimeSlot(slot, { ...slot, [field]: value })).toBe(false);
    });
});
