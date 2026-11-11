import { beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../../Models/UserSchema.js';
import Doctor from '../../Models/DoctorSchema.js';
import { emitSupportNotification, supportNotification, withSupportSenderPhotos } from '../../utils/supportRealtime.js';
vi.mock('../../Models/UserSchema.js', () => ({ default: { find: vi.fn() } }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: { find: vi.fn() } }));
const query = (rows) => ({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(rows) }) });
beforeEach(() => {
    User.find.mockReturnValue(query([{ _id: 'u1', photo: '/patient.png', email: 'private' }]));
    Doctor.find.mockReturnValue(query([{ _id: 'd1', photo: '/doctor.png' }]));
});
describe('support notification sender presentation', () => {
    it('resolves photos by account role in batches and excludes private account information', async () => {
        const rows = await withSupportSenderPhotos([
            { _id: 'r1', senderId: 'u1', senderRole: 'patient', fullname: 'Edited name' },
            { _id: 'r2', senderId: 'd1', senderRole: 'doctor' },
            { _id: 'r3', senderRole: 'guest' },
        ]);
        expect(rows.map((r) => supportNotification(r).photo)).toEqual(['/patient.png', '/doctor.png', '']);
        expect(supportNotification(rows[0]).fullname).toBe('Edited name');
        expect(supportNotification(rows[0]).email).toBeUndefined();
        expect(User.find).toHaveBeenCalledTimes(1);
        expect(Doctor.find).toHaveBeenCalledTimes(1);
    });
    it('still emits after an avatar lookup fails', async () => {
        Doctor.find.mockImplementation(() => { throw new Error('unavailable'); });
        const io = { to: vi.fn().mockReturnThis(), emit: vi.fn() };
        await emitSupportNotification(io, { _id: 'r1', senderId: 'd1', senderRole: 'doctor', createdAt: 'date' });
        expect(io.emit).toHaveBeenCalledWith('support-notification', expect.objectContaining({ photo: '', senderRole: 'doctor', requestCreatedAt: 'date' }));
    });
});
