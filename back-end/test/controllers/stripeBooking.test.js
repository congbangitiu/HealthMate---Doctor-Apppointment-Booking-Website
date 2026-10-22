import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const save = vi.fn();
    const createSession = vi.fn();
    const constructEvent = vi.fn();
    return {
        save,
        createSession,
        constructEvent,
        Stripe: vi.fn(function StripeMock() {
            this.checkout = { sessions: { create: createSession } };
            this.webhooks = { constructEvent };
        }),
        Booking: vi.fn(function BookingModel(data) {
            Object.assign(this, data);
            this.save = save;
        }),
        findBooking: vi.fn(),
        Doctor: { findById: vi.fn(), updateOne: vi.fn() },
        User: { findById: vi.fn() },
        populate: vi.fn(),
        sendMail: vi.fn(),
        to: vi.fn(),
        emit: vi.fn(),
    };
});

vi.mock('stripe', () => ({ default: mocks.Stripe }));
vi.mock('../../Models/BookingSchema.js', () => {
    mocks.Booking.findOne = mocks.findBooking;
    return { default: mocks.Booking };
});
vi.mock('../../Models/DoctorSchema.js', () => ({ default: mocks.Doctor }));
vi.mock('../../Models/UserSchema.js', () => ({ default: mocks.User }));
vi.mock('../../utils/mailTransporter.js', () => ({ default: { sendMail: mocks.sendMail } }));

import { getCheckoutSession, stripeWebhook } from '../../Controllers/bookingController.js';

const slot = { day: '2026-10-22', startingTime: '08:00', endingTime: '08:30' };
const now = new Date('2026-10-21T10:00:00+07:00');
let doctor;
let user;
let event;
let savedBooking;

const createResponse = () => {
    const res = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

const checkoutRequest = (overrides = {}) => ({
    params: { doctorId: 'doctor-id' },
    userId: 'patient-id',
    body: { timeSlot: { ...slot }, paymentMethod: 'e-wallet', ...overrides },
});

const webhookRequest = () => ({
    headers: { 'stripe-signature': 'test-signature' },
    body: Buffer.from(JSON.stringify(event)),
    io: { to: mocks.to },
});

const expectNoBookingEffects = () => {
    expect(mocks.Booking).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.to).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
};

beforeEach(() => {
    // Preserve the Stripe instance created at module import; reset its methods separately.
    vi.clearAllMocks();
    for (const mock of [mocks.save, mocks.findBooking, mocks.createSession, mocks.constructEvent,
        mocks.Doctor.findById, mocks.Doctor.updateOne, mocks.User.findById,
        mocks.populate, mocks.sendMail, mocks.to, mocks.emit]) mock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    doctor = {
        _id: 'doctor-id', id: 'doctor-id', fullname: 'Test Doctor',
        ticketPrice: 25, bio: 'Doctor biography', photo: 'doctor.jpg', timeSlots: [{ ...slot }],
    };
    user = { _id: 'patient-id', email: 'patient@example.test', fullname: 'Test Patient', photo: 'patient.jpg' };
    event = {
        id: 'evt_completed', type: 'checkout.session.completed',
        data: { object: {
            id: 'cs_test_booking', payment_status: 'paid', amount_total: 2500, currency: 'usd',
            metadata: {
                userId: 'patient-id', doctorId: 'doctor-id', timeSlot: JSON.stringify(slot),
                ticketPrice: '25', paymentMethod: 'e-wallet',
            },
        } },
    };
    savedBooking = { _id: 'booking-id', createdAt: now };
    mocks.save.mockResolvedValue(savedBooking);
    mocks.findBooking.mockResolvedValue(null);
    mocks.createSession.mockResolvedValue({ id: 'cs_test_booking', url: 'https://checkout.stripe.test/session' });
    mocks.constructEvent.mockImplementation(() => event);
    mocks.populate.mockImplementation(async () => doctor);
    mocks.Doctor.findById.mockReturnValue({ populate: mocks.populate });
    mocks.User.findById.mockImplementation(async () => user);
    mocks.Doctor.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    mocks.sendMail.mockResolvedValue({});
    mocks.to.mockReturnValue({ emit: mocks.emit });
});

describe('getCheckoutSession', () => {
    it('BE-S01: returns 404 without calling Stripe when the doctor does not exist', async () => {
        doctor = null;
        const res = createResponse();
        await getCheckoutSession(checkoutRequest(), res);
        expect(mocks.Doctor.findById).toHaveBeenCalledWith('doctor-id');
        expect(mocks.populate).toHaveBeenCalledWith('appointments');
        expect(mocks.User.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Doctor not found' });
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it('BE-S01: returns 404 without calling Stripe when the authenticated patient does not exist', async () => {
        user = null;
        const res = createResponse();
        await getCheckoutSession(checkoutRequest(), res);
        expect(mocks.User.findById).toHaveBeenCalledWith('patient-id');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it('BE-S02: uses the authenticated patient and server price instead of client-supplied identity and price', async () => {
        const res = createResponse();
        await getCheckoutSession(checkoutRequest({ userId: 'other-patient', ticketPrice: 1 }), res);
        expect(mocks.User.findById).toHaveBeenCalledExactlyOnceWith('patient-id');
        expect(mocks.createSession).toHaveBeenCalledExactlyOnceWith({
            payment_method_types: ['card'], mode: 'payment',
            success_url: `${process.env.CLIENT_SITE_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_SITE_URL}/doctors/doctor-id`,
            customer_email: 'patient@example.test', client_reference_id: 'doctor-id',
            metadata: { userId: 'patient-id', doctorId: 'doctor-id', timeSlot: JSON.stringify(slot), ticketPrice: '25', paymentMethod: 'e-wallet' },
            line_items: [{ price_data: {
                currency: 'usd', unit_amount: 2500,
                product_data: { name: doctor.fullname, description: doctor.bio, images: [doctor.photo] },
            }, quantity: 1 }],
        });
        expect(mocks.Stripe).toHaveBeenCalledWith(process.env.STRIPE_SECRET_KEY);
        expectNoBookingEffects();
    });

    it('BE-S03: returns the checkout session without creating a paid booking', async () => {
        const session = { id: 'cs_test_booking', url: 'https://checkout.stripe.test/session' };
        const res = createResponse();
        await getCheckoutSession(checkoutRequest(), res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Transaction initiated', session });
        expectNoBookingEffects();
    });

    it.each(['doctor lookup', 'patient lookup', 'Stripe create'])(
        'BE-S04: returns 500 without booking effects when %s fails', async (stage) => {
            const dependency = { 'doctor lookup': mocks.populate, 'patient lookup': mocks.User.findById, 'Stripe create': mocks.createSession }[stage];
            dependency.mockRejectedValue(new Error('dependency unavailable'));
            const res = createResponse();
            await getCheckoutSession(checkoutRequest(), res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error in creating checkout session', error: 'dependency unavailable' });
            if (stage !== 'Stripe create') expect(mocks.createSession).not.toHaveBeenCalled();
            expectNoBookingEffects();
        },
    );

    it.each(['unavailable', 'past', 'missing'])(
        'BE-S05: rejects slot state "%s" before creating a Stripe session', async (kind) => {
            const req = checkoutRequest();
            if (kind === 'unavailable') doctor.timeSlots = [];
            if (kind === 'past') {
                req.body.timeSlot = { ...slot, day: '2026-10-20' };
                doctor.timeSlots = [req.body.timeSlot];
            }
            if (kind === 'missing') delete req.body.timeSlot;
            const res = createResponse();
            await getCheckoutSession(req, res);
            expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
            expect(res.status.mock.calls[0][0]).toBeLessThan(500);
            expect(mocks.createSession).not.toHaveBeenCalled();
        },
    );

    it('BE-S05: requires authentication before querying or creating a Stripe session', async () => {
        const req = checkoutRequest();
        delete req.userId;
        const res = createResponse();
        await getCheckoutSession(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.Doctor.findById).not.toHaveBeenCalled();
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it.each([undefined, null, [], 'invalid'])('BE-S05: rejects malformed body %j without calling Stripe', async (body) => {
        const req = checkoutRequest();
        req.body = body;
        const res = createResponse();
        await getCheckoutSession(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it.each([undefined, 'cash', 'free', 'invalid'])('BE-S05: rejects payment method %s on the checkout endpoint', async (paymentMethod) => {
        const res = createResponse();
        await getCheckoutSession(checkoutRequest({ paymentMethod }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it('BE-S05: rejects a reversed range even when it appears in doctor availability', async () => {
        const invalidSlot = { ...slot, endingTime: '07:30' };
        doctor.timeSlots = [invalidSlot];
        const res = createResponse();
        await getCheckoutSession(checkoutRequest({ timeSlot: invalidSlot }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.createSession).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });
});

describe('stripeWebhook', () => {
    beforeEach(() => {
        mocks.Doctor.findById.mockImplementation(async () => doctor);
    });

    it.each(['invalid signature', 'missing signature'])(
        'BE-W01: returns 400 without writes when Stripe rejects signature state "%s"', async (kind) => {
            mocks.constructEvent.mockImplementation(() => { throw new Error('Signature verification failed'); });
            const req = webhookRequest();
            if (kind === 'missing signature') delete req.headers['stripe-signature'];
            const res = createResponse();
            await stripeWebhook(req, res);
            expect(mocks.constructEvent).toHaveBeenCalledExactlyOnceWith(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Webhook error', error: 'Signature verification failed' });
            expectNoBookingEffects();
        },
    );

    it.each(['payment_intent.succeeded', 'checkout.session.expired'])(
        'BE-W02: acknowledges unrelated event %s without writing a booking', async (type) => {
            event.type = type;
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ received: true });
            expectNoBookingEffects();
        },
    );

    it('BE-W03: rejects a completed session without metadata before saving', async () => {
        delete event.data.object.metadata;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Metadata is missing from the Stripe session' }));
        expectNoBookingEffects();
    });

    it.each(['not-json', undefined])('BE-W04: rejects malformed timeSlot JSON %s without writes', async (value) => {
        event.data.object.metadata.timeSlot = value;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expectNoBookingEffects();
    });

    it('BE-W05: saves a paid booking, removes its slot and increments the doctor count', async () => {
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(mocks.Booking).toHaveBeenCalledExactlyOnceWith({
            doctor: 'doctor-id', user: 'patient-id', ticketPrice: '25', paymentMethod: 'e-wallet',
            isPaid: true, timeSlot: slot, unread: true, session: 'cs_test_booking',
        });
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(2);
        expect(mocks.Doctor.updateOne).toHaveBeenNthCalledWith(1, { _id: 'doctor-id' }, { $pull: { timeSlots: slot } });
        expect(mocks.Doctor.updateOne).toHaveBeenNthCalledWith(2, { _id: 'doctor-id' }, { $inc: { totalPatients: 1 } });
        expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.Doctor.updateOne.mock.invocationCallOrder[0]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('BE-W05: emails the patient and emits paid booking details to the doctor room', async () => {
        await stripeWebhook(webhookRequest(), createResponse());
        expect(mocks.User.findById).toHaveBeenCalledWith('patient-id');
        expect(mocks.Doctor.findById).toHaveBeenCalledWith('doctor-id');
        expect(mocks.sendMail).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ to: user.email, subject: 'HealthMate - Booking Confirmation' }));
        const html = mocks.sendMail.mock.calls[0][0].html;
        expect(html).toContain('Test Patient');
        expect(html).toContain('Test Doctor');
        expect(html).toContain('$25');
        expect(html).toContain('<td>Paid</td>');
        expect(mocks.to).toHaveBeenCalledExactlyOnceWith('doctor-id');
        expect(mocks.emit).toHaveBeenCalledExactlyOnceWith('booking-notification', {
            bookingId: 'booking-id', user: { id: user._id, fullname: user.fullname, photo: user.photo },
            timeSlot: slot, ticketPrice: '25', paymentMethod: 'e-wallet', isPaid: true,
            unread: true, status: 'pending', createdAt: now,
        });
    });

    it.each(['patient', 'doctor'])(
        'BE-W06: returns 400 before saving when the %s no longer exists', async (kind) => {
            if (kind === 'patient') user = null;
            else doctor = null;
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expectNoBookingEffects();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'User or Doctor not found' }));
            expect(mocks.sendMail).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        },
    );

    it('BE-W07: does not process the same completed session twice', async () => {
        // Model the persisted session returned on the second delivery.
        mocks.findBooking.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...savedBooking, session: event.data.object.id });
        const req = webhookRequest();
        await stripeWebhook(req, createResponse());
        await stripeWebhook(req, createResponse());
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.Doctor.updateOne).toHaveBeenCalledTimes(2);
        expect(mocks.sendMail).toHaveBeenCalledTimes(1);
        expect(mocks.emit).toHaveBeenCalledTimes(1);
        expect(mocks.findBooking).toHaveBeenNthCalledWith(1, { session: 'cs_test_booking' });
        expect(mocks.findBooking).toHaveBeenNthCalledWith(2, { session: 'cs_test_booking' });
    });

    it('BE-W08: does not create a paid booking for an unpaid completed session', async () => {
        event.data.object.payment_status = 'unpaid';
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expectNoBookingEffects();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('BE-W09: forwards the original raw Buffer and signature to the Stripe SDK', async () => {
        const req = webhookRequest();
        await stripeWebhook(req, createResponse());
        expect(Buffer.isBuffer(req.body)).toBe(true);
        expect(mocks.constructEvent.mock.calls[0][0]).toBe(req.body);
        expect(mocks.constructEvent).toHaveBeenCalledWith(req.body, 'test-signature', process.env.STRIPE_WEBHOOK_SECRET);
    });

    it.todo('BE-W09: preserves raw bytes through the actual Express app and validates a real Stripe signature (integration)');

    it.each(['amount mismatch', 'unavailable slot'])(
        'BE-W10: prevents a paid booking with %s', async (kind) => {
            if (kind === 'amount mismatch') {
                // A complete, otherwise valid event isolates the missing amount check.
                event.data.object.amount_total = 100;
            } else {
                doctor.timeSlots = [];
            }
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(mocks.save).not.toHaveBeenCalled();
            expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
            expect(mocks.emit).not.toHaveBeenCalled();
        },
    );

    it.todo('BE-W07/BE-W10: prevents duplicate or conflicting bookings under concurrent webhook delivery (MongoDB integration)');

    it('BE-W11: stops before slot updates and notifications if booking saving fails', async () => {
        mocks.save.mockRejectedValue(new Error('save unavailable'));
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.Doctor.updateOne).not.toHaveBeenCalled();
        expect(mocks.sendMail).not.toHaveBeenCalled();
        expect(mocks.emit).not.toHaveBeenCalled();
    });

    it.each(['first update', 'second update', 'socket'])(
        'BE-W12 [LIMITATION]: returns 400 after save when %s fails without proving rollback', async (stage) => {
            const error = new Error('dependency unavailable');
            if (stage === 'first update') mocks.Doctor.updateOne.mockRejectedValueOnce(error);
            if (stage === 'second update') mocks.Doctor.updateOne.mockResolvedValueOnce({ modifiedCount: 1 }).mockRejectedValueOnce(error);
            if (stage === 'socket') mocks.emit.mockImplementation(() => { throw error; });
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expect(mocks.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(400);
            if (stage !== 'socket') {
                expect(mocks.sendMail).not.toHaveBeenCalled();
                expect(mocks.emit).not.toHaveBeenCalled();
            }
        },
    );

    it.each(['patient lookup', 'doctor lookup', 'session lookup'])(
        'BE-W12: stops before writing when %s fails', async (stage) => {
            const dependency = { 'patient lookup': mocks.User.findById, 'doctor lookup': mocks.Doctor.findById, 'session lookup': mocks.findBooking }[stage];
            dependency.mockRejectedValue(new Error('dependency unavailable'));
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expect(res.status).toHaveBeenCalledWith(400);
            expectNoBookingEffects();
        },
    );

    it('BE-W07: acknowledges an existing session before rechecking availability or changed fees', async () => {
        mocks.findBooking.mockResolvedValue({ ...savedBooking, session: event.data.object.id });
        event.id = 'evt_redelivery_with_another_event_id';
        doctor.timeSlots = [];
        doctor.ticketPrice = 100;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(mocks.User.findById).not.toHaveBeenCalled();
        expect(mocks.Doctor.findById).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it('BE-W10: accepts a delayed paid event when its original slot is still available', async () => {
        const originalSlot = { ...slot, day: '2026-10-20' };
        event.data.object.metadata.timeSlot = JSON.stringify(originalSlot);
        doctor.timeSlots = [originalSlot];
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mocks.Booking).toHaveBeenCalledWith(expect.objectContaining({ timeSlot: originalSlot, isPaid: true }));
    });

    it.each([['19.99', 1999], ['0.29', 29], ['25', 2500]])(
        'BE-W10: honors checkout price %s and amount %i after the doctor changes their fee', async (ticketPrice, amount) => {
            doctor.ticketPrice = 100;
            event.data.object.metadata.ticketPrice = ticketPrice;
            event.data.object.amount_total = amount;
            const res = createResponse();
            await stripeWebhook(webhookRequest(), res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(mocks.Booking).toHaveBeenCalledWith(expect.objectContaining({ ticketPrice, isPaid: true }));
        },
    );

    it.each([
        ['currency', 'vnd'], ['currency', undefined], ['amount_total', undefined],
        ['amount_total', '2500'], ['amount_total', -1], ['amount_total', 2500.5],
    ])('BE-W10: rejects invalid payment field %s=%s before writes', async (field, value) => {
        event.data.object[field] = value;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expectNoBookingEffects();
    });

    it.each([
        ['ticketPrice', ''], ['ticketPrice', '-25'], ['ticketPrice', 'NaN'], ['ticketPrice', undefined],
        ['userId', ''], ['doctorId', ''], ['paymentMethod', 'cash'],
        ['timeSlot', 'null'], ['timeSlot', '[]'], ['timeSlot', '{}'],
    ])('BE-W03: rejects invalid metadata field %s=%s before writes', async (field, value) => {
        event.data.object.metadata[field] = value;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expectNoBookingEffects();
    });

    it('BE-W07: rejects a missing session id without querying an undefined id', async () => {
        delete event.data.object.id;
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(mocks.findBooking).not.toHaveBeenCalled();
        expectNoBookingEffects();
    });

    it('BE-W13: acknowledges the saved booking and emits even if email delivery fails', async () => {
        mocks.sendMail.mockRejectedValue(new Error('mail unavailable'));
        const res = createResponse();
        await stripeWebhook(webhookRequest(), res);
        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.emit).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
    });
});
