import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import Booking from '../Models/BookingSchema.js';
import Stripe from 'stripe';

export const createBooking = async (req, res) => {
    try {
        const { doctorId, userId, timeSlot, ticketPrice, paymentMethod } = req.body;

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if timeSlot exists in doctor's list
        const availableSlot = doctor.timeSlots.some(
            (slot) =>
                slot.day === timeSlot.day &&
                slot.startingTime === timeSlot.startingTime &&
                slot.endingTime === timeSlot.endingTime,
        );

        if (!availableSlot) {
            return res.status(400).json({ success: false, message: 'Selected time slot is no longer available' });
        }

        // Create new booking
        const newBooking = new Booking({
            doctor: doctorId,
            user: userId,
            ticketPrice,
            paymentMethod,
            isPaid: false,
            timeSlot,
        });

        await newBooking.save();

        // Remove the set timeSlot from the doctor's free time list
        await Doctor.updateOne({ _id: doctorId }, { $pull: { timeSlots: timeSlot } });

        res.status(201).json({ success: true, message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Error creating booking', error: error.message });
    }
};

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

export const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const appointment = await Booking.findByIdAndUpdate(id, { status }, { new: true }).populate('doctor');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        // Only add the time slot back to the doctor's available slots if the appointment is cancelled
        if (status === 'cancelled') {
            const doctor = await Doctor.findById(appointment.doctor._id);

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor not found',
                });
            }

            const { timeSlot } = appointment;
            doctor.timeSlots.push(timeSlot);
            await doctor.save();
        }

        res.status(200).json({
            success: true,
            message: 'Appointment status updated successfully',
            data: appointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

export const getAllAppointments = async (req, res) => {
    try {
        const appointments = await Booking.find({});

        res.status(200).json({
            success: true,
            message: 'All appointments are found successfully',
            data: appointments,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'All appointments are not found !!!',
        });
    }
};
