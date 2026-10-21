import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

const mocks = vi.hoisted(() => ({ updateDoctor: vi.fn() }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: { findByIdAndUpdate: mocks.updateDoctor } }));
import Review from '../../Models/ReviewSchema.js';

const doctorId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.updateDoctor.mockReset().mockResolvedValue({});
});

describe('Review.calcAverageRatings', () => {
    it.each([[2, 4.5], [1, 5], [3, 0]])(
        'BE-RV01: stores count %i and average %s from the aggregation result', async (count, average) => {
            const aggregate = vi.spyOn(Review, 'aggregate').mockResolvedValue([{ _id: doctorId, numOfRating: count, avgRating: average }]);
            await Review.calcAverageRatings(doctorId);
            expect(aggregate).toHaveBeenCalledExactlyOnceWith([
                { $match: { doctor: doctorId } },
                { $group: { _id: '$doctor', numOfRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
            ]);
            expect(mocks.updateDoctor).toHaveBeenCalledExactlyOnceWith(doctorId, { totalRating: count, averageRating: average });
        },
    );

    it.fails('BE-RV02 [KNOWN BUG]: handles an empty aggregation result without throwing', async () => {
        vi.spyOn(Review, 'aggregate').mockResolvedValue([]);
        await expect(Review.calcAverageRatings(doctorId)).resolves.toBeUndefined();
        // Do not assume a zero/null fallback policy until it has been confirmed.
    });

    it('BE-RV04: propagates aggregation errors without updating doctor ratings', async () => {
        const error = new Error('aggregation unavailable');
        vi.spyOn(Review, 'aggregate').mockRejectedValue(error);
        await expect(Review.calcAverageRatings(doctorId)).rejects.toBe(error);
        expect(mocks.updateDoctor).not.toHaveBeenCalled();
    });

    it('BE-RV04: propagates doctor update errors to the direct caller', async () => {
        const error = new Error('doctor update unavailable');
        vi.spyOn(Review, 'aggregate').mockResolvedValue([{ numOfRating: 2, avgRating: 4.5 }]);
        mocks.updateDoctor.mockRejectedValue(error);
        await expect(Review.calcAverageRatings(doctorId)).rejects.toBe(error);
    });

    it.todo('BE-RV03: aggregates actual reviews for one doctor without mixing another doctor reviews (MongoDB integration)');
    it.todo('BE-RV05: verifies post-save rating updates and async failure handling with real middleware (MongoDB integration)');
});

describe('Review schema validation', () => {
    it.each([[0, true], [5, true], [-1, false], [6, false]])(
        'BE-RV06: validates rating %s with expected acceptance %s', (rating, valid) => {
            const error = new Review({ doctor: doctorId, reviewText: 'Test feedback', rating }).validateSync();
            if (valid) expect(error).toBeUndefined();
            else expect(error.errors.rating).toBeDefined();
        },
    );

    it('BE-RV06: rejects missing review text with the real schema', () => {
        const error = new Review({ doctor: doctorId, rating: 4 }).validateSync();
        expect(error.errors.reviewText).toBeDefined();
    });
});
