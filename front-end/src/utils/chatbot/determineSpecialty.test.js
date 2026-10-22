import { describe, expect, it, vi } from 'vitest';

vi.mock('../../assets/data/chatbot/symptomToSpecialty.js', () => ({ default: {
    'severe chest pain': 'Cardiology fixture',
    'itchy skin': 'Dermatology fixture',
    'red eye': 'Ophthalmology fixture',
} }));
import determineSpecialty from './determineSpecialty';

describe('determineSpecialty with a controlled mapping', () => {
    it.each(['I have severe chest pain', 'SEVERE CHEST PAIN', 'Severe Chest Pain'])(
        'FE-C01: matches the complete keyword without case sensitivity: %s', (text) => {
            expect(determineSpecialty(text)).toBe('Cardiology fixture');
        },
    );

    it.each([['My skin feels uncomfortable', 'Dermatology fixture'], ['I feel chest discomfort', 'Cardiology fixture']])(
        'FE-C02: uses an individual keyword word longer than three characters: %s', (text, expected) => {
            expect(determineSpecialty(text)).toBe(expected);
        },
    );

    it.each(['The weather is pleasant', '', 'I see a red light'])(
        'FE-C03: returns null without a complete keyword or eligible fallback word: %j', (text) => {
            expect(determineSpecialty(text)).toBeNull();
        },
    );

    it('FE-C04: prefers a complete keyword over an earlier partial-word fallback', () => {
        expect(determineSpecialty('Chest discomfort with itchy skin')).toBe('Dermatology fixture');
    });

    it.each([null, undefined, 123, {}])(
        'FE-C09: returns no specialty for a non-string input instead of throwing: %j', (text) => {
            expect(determineSpecialty(text)).toBeNull();
        },
    );

    it.todo('FE-C04: defines an explicit tie-break rule when multiple complete or fallback keywords match different specialties');
});
