import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { sameId } from '../../auth/sameId.js';

const id = '507f1f77bcf86cd799439011';
describe('sameId', () => {
    it.each([id, new mongoose.Types.ObjectId(id), { _id: id }, { _id: new mongoose.Types.ObjectId(id) }, id.toUpperCase()])(
        'compares a real MongoDB reference with its authenticated id: %j', (reference) => {
            expect(sameId(reference, id)).toBe(true);
            expect(sameId(id, reference)).toBe(true);
        },
    );
    it.each([null, undefined, '', {}, [], { _id: null }, 123, 'another-id'])(
        'rejects absent, invalid or different references: %j', (reference) => {
            expect(sameId(reference, id)).toBe(false);
            expect(sameId(reference, reference)).toBe(reference === 'another-id');
        },
    );
});
