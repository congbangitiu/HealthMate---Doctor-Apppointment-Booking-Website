import { describe, expect, it } from 'vitest';
import determineSpecialty from './determineSpecialty';

// These fixtures verify the shipped mapping, not the clinical appropriateness of a specialty.
describe('determineSpecialty with the real mapping', () => {
    it.each([
        ['BLOOD TEST', 'Paraclinical Department'],
        ['persistent cough', 'Respiratory Department'],
        ['blurry vision', 'Ophthalmology Department'],
        ['toothache', 'Dentomaxillofacial Department'],
        ['rash in child', 'Pediatrics Department'],
    ])('FE-C01: maps the configured keyword %s to %s', (text, expected) => {
        expect(determineSpecialty(text)).toBe(expected);
    });
});
