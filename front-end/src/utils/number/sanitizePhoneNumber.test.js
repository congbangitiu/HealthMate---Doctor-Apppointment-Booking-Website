import { describe, expect, it } from 'vitest';
import { sanitizePhoneNumber } from './sanitizePhoneNumber';

describe('sanitizePhoneNumber', () => {
    it('FE-U05: removes separators while preserving the leading zero', () => {
        expect(sanitizePhoneNumber('090 123-4567')).toBe('0901234567');
    });

    it('FE-U06: removes country-prefix punctuation and letters without inventing a local prefix', () => {
        expect(sanitizePhoneNumber('+84 (90) abc123')).toBe('8490123');
    });

    it.each([null, undefined, 901234567, {}, [], true, new String('0901234567')])(
        'FE-U07: returns an empty string for a non-string value: %j', (value) => {
            expect(sanitizePhoneNumber(value)).toBe('');
        },
    );

    it.each(['0901234567', '0000123', '0', ''])(
        'FE-U08: preserves an already sanitized string: %j', (value) => {
            expect(sanitizePhoneNumber(value)).toBe(value);
        },
    );

    it.each(['abc', ' +()-\n\t '])('FE-U09: returns an empty string when no digits remain: %j', (value) => {
        expect(sanitizePhoneNumber(value)).toBe('');
    });
});
