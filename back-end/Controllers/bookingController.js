import User from '../models/UserSchema.js';
import Doctor from '../models/DoctorSchema.js';
import Booking from '../models/BookingSchema.js';
import Stripe from 'stripe';

export const getCheckoutSession = async (req, res) => {
    try {
        // Get currently booked doctor
        const doctor = await Doctor.findById(req.params.doctorId).populate('appointments');
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { timeSlot } = req.body;

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${process.env.CLIENT_SITE_URL}/checkout-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/doctors/${doctor.id}`,
            customer_email: user.email,
            client_reference_id: req.params.doctorId,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: doctor.ticketPrice * 100,
                        product_data: {
                            name: doctor.fullname,
                            description: doctor.bio,
                            images: [doctor.photo],
                        },
                    },
                    quantity: 1,
                },
            ],
        });

        // Create new booking
        const booking = new Booking({
            doctor: doctor._id,
            user: user._id,
            ticketPrice: doctor.ticketPrice,
            session: session.id,
            timeSlot: {
                day: timeSlot.day,
                startingTime: timeSlot.startingTime,
                endingTime: timeSlot.endingTime,
            },
        });

        // Check if the user already has an appointment with this doctor
        const existingAppointment = await Booking.findOne({ doctor: doctor._id, user: user._id });

        if (!existingAppointment) {
            // Increment totalPatients if the user doesn't have an existing appointment
            doctor.totalPatients += 1;
            await doctor.save();
        }

        await booking.save();

        // Remove the booked time slot from the doctor's available time slots
        await Doctor.updateOne({ _id: doctor._id }, { $pull: { timeSlots: timeSlot } });

        res.status(200).json({ success: true, message: 'Transaction successfully', session });
    } catch (error) {
        console.error('Error in creating checkout session:', error);
        res.status(500).json({ success: false, message: 'Error in creating checkout session', error: error.message });
    }
};
