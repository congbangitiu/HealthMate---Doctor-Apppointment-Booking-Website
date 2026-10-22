import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('i18next', () => ({ default: { language: 'en' } }));
import i18n from 'i18next';
import convertTime from './convertTime';

const normalizeSpaces = (value) => value.replace(/[\u00a0\u202f]/g, ' ');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00+07:00'));
    i18n.language = 'en';
});

describe('convertTime (frontend)', () => {
    it.each(['00:00', '12:00', '18:30'])('FE-D08: formats %s as a Vietnamese 24-hour time', (time) => {
        i18n.language = 'vi';
        expect(normalizeSpaces(convertTime(time))).toBe(time);
    });

    it.each([['00:00', '12:00 AM'], ['12:00', '12:00 PM'], ['18:30', '06:30 PM']])(
        'FE-D09: formats %s as %s in English', (time, expected) => {
            expect(normalizeSpaces(convertTime(time))).toBe(expected);
        },
    );

    it('FE-D10: reads the current language again when the language changes', () => {
        expect(normalizeSpaces(convertTime('18:30'))).toBe('06:30 PM');
        i18n.language = 'vi';
        expect(convertTime('18:30')).toBe('18:30');
        i18n.language = 'en';
        expect(normalizeSpaces(convertTime('18:30'))).toBe('06:30 PM');
    });

    it.each([
        ['8:05', '08:05', '08:05 AM'], ['23:59', '23:59', '11:59 PM'], ['0:5', '00:05', '12:05 AM'],
    ])('FE-D12: preserves valid clock input %s in both supported languages', (input, vietnamese, english) => {
        i18n.language = 'vi';
        expect(convertTime(input)).toBe(vietnamese);
        i18n.language = 'en';
        expect(normalizeSpaces(convertTime(input))).toBe(english);
    });

    it.each([null, undefined, '', '25:99', '12:60', '-1:30', '12:30junk'])(
        'FE-D11: rejects invalid input instead of normalizing it into a valid clock time: %j', (input) => {
            let result;
            try { result = convertTime(input); }
            catch (error) { expect(error).toBeInstanceOf(Error); return; }
            expect(result).toBeNull();
        },
    );
});
