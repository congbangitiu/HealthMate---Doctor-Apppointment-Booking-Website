import { beforeEach, describe, expect, it, vi } from 'vitest';
import convertTime from '../../utils/date-time/convertTime.js';

const normalizeSpaces = (value) => value.replace(/[\u00a0\u202f]/g, ' ');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00+07:00'));
});

describe('convertTime (backend)', () => {
    it.each([['00:00', '12:00 AM'], ['12:00', '12:00 PM'], ['18:30', '06:30 PM']])(
        'BE-DT01: formats %s as %s without frontend i18n', (time, expected) => {
            expect(normalizeSpaces(convertTime(time))).toBe(expected);
        },
    );

    it.each([null, undefined, '', '25:99', '12:60', '-1:30', '12:30junk'])(
        'BE-DT02: rejects invalid input instead of normalizing it into a valid clock time: %j', (input) => {
            let result;
            try { result = convertTime(input); }
            catch (error) { expect(error).toBeInstanceOf(Error); return; }
            expect(result).toBeNull();
        },
    );

    it.each([['8:05', '08:05 AM'], ['23:59', '11:59 PM'], ['0:5', '12:05 AM']])(
        'BE-DT03: preserves valid clock input %s as %s', (input, expected) => {
            expect(normalizeSpaces(convertTime(input))).toBe(expected);
        },
    );
});
