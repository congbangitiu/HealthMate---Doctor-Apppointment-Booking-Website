import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import jwt from 'jsonwebtoken';
import contactRoutes from '../../Routes/contact.js';
import User from '../../Models/UserSchema.js';
import Doctor from '../../Models/DoctorSchema.js';
import SupportRequest from '../../Models/SupportRequestSchema.js';

vi.mock('../../Models/UserSchema.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../../Models/DoctorSchema.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../../Models/SupportRequestSchema.js', () => ({
    default: { find: vi.fn(), countDocuments: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn(), findOneAndUpdate: vi.fn() },
    supportStatuses: ['new', 'in-progress', 'resolved', 'spam'],
    supportCategories: ['technical', 'other'],
}));
let server, url;
const id = '507f1f77bcf86cd799439011';
beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/contacts', contactRoutes);
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    url = 'http://127.0.0.1:' + server.address().port + '/contacts';
});
afterAll(async () => { await new Promise((resolve) => server.close(resolve)); });
beforeEach(() => {
    User.findById.mockResolvedValue({ role: 'patient' });
    Doctor.findById.mockResolvedValue(null);
});
const routes = [['GET', ''], ['GET', '/' + id], ['POST', '/' + id + '/read'], ['PATCH', '/' + id]];
describe('admin-only support endpoints', () => {
    it.each(routes)('blocks a guest from %s %s', async (method, path) => {
        const res = await fetch(url + path, { method });
        expect(res.status).toBe(401);
    });
    it.each(routes)('blocks a patient from %s %s', async (method, path) => {
        const token = jwt.sign({ id, role: 'patient' }, process.env.JWT_SECRET_KEY);
        const res = await fetch(url + path, { method, headers: { Authorization: 'Bearer ' + token } });
        expect(res.status).toBe(401);
    });
    it('uses the database role even when a token claims admin', async () => {
        const token = jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET_KEY);
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        expect(res.status).toBe(401);
        expect(SupportRequest.find).not.toHaveBeenCalled();
    });
    it('allows a database-confirmed admin to list requests', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        const query = { select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), lean: vi.fn().mockResolvedValue([]) };
        SupportRequest.find.mockReturnValue(query);
        SupportRequest.countDocuments.mockResolvedValue(0);
        const token = jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET_KEY);
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ success: true, data: [], total: 0 });
    });
});
