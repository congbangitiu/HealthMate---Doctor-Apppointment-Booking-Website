import User from '../Models/UserSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import Booking from '../Models/BookingSchema.js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

import formatDate from '../../front-end/src/utils/formatDate.js';
import convertTime from '../../front-end/src/utils/convertTime.js';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sendConfirmationEmail = async (userEmail, bookingInfo) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"HealthMate" <${process.env.EMAIL_USERNAME}>`,
            to: userEmail,
            subject: 'HealthMate - Booking Confirmation',
            html: `
                <p style="color: #000000;">Dear ${bookingInfo.userName},</p>
                <p style="color: #000000;">Your appointment has been successfully booked with the following details:</p>
                <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <th style="text-align: left;">Doctor</th>
                        <td>${bookingInfo.doctorName}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left;">Date</th>
                        <td>${formatDate(bookingInfo.timeSlot.day)}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left;">Time</th>
                        <td>${convertTime(bookingInfo.timeSlot.startingTime)} - ${convertTime(
                bookingInfo.timeSlot.endingTime,
            )}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left;">Price</th>
                        <td>$${bookingInfo.ticketPrice}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left;">Payment Method</th>
                        <td>${bookingInfo.paymentMethod.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <th style="text-align: left;">Payment Status</th>
                        <td>${bookingInfo.isPaid ? 'Paid' : 'Unpaid'}</td>
                    </tr>
                </table>
                <p style="color: #000000;"><strong>Please make sure to arrive on time for our appointment. I appreciate your punctuality!</strong></p>
                <p style="color: #000000; font-style: italic; margin-top: 20px">Best regards,</p>
                <strong style="color: #000000;">HealthMate Clinic</strong>
                <p style="color: #4e545f; font-style: italic">CONFIDENTIALITY NOTICE: This email is intended only for the person(s) named in the message body. Unless otherwise indicated, it contains information that is confidential, privileged, and/or exempt from disclosure under applicable law. If you have received this message in error, please notify the sender and delete the message.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Create booking when user chooses cash payment
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

        // Send confirmation email to user
        await sendConfirmationEmail(user.email, {
            userName: user.fullname,
            doctorName: doctor.fullname,
            timeSlot,
            ticketPrice,
            paymentMethod,
            isPaid: false,
        });

        res.status(201).json({ success: true, message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Error creating booking', error: error.message });
    }
};

// Create checkout session when user chooses e-wallet payment
export const stripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];

    // First terminal, run the command "npx ngrok http 5000" to create a tunnel to localhost:5000
    // Second terminal, run the command "stripe listen --forward-to http://localhost:5000/api/v1/bookings/webhook/stripe" in folder "back-end" to listen for Stripe events
    // Then run the command "stripe trigger checkout.session.completed" in the same folder to trigger the event
    // This will simulate a successful payment and create a booking
    // Finally, make the booking in the front-end and check the database to see if the booking was created successfully

    try {
        // Convert request body to string before verifying signature
        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === 'checkout.session.completed') {
            console.log('Payment Successful! Processing booking...');
            const session = event.data.object;

            // Check if metadata exists
            if (!session.metadata) {
                throw new Error('Metadata is missing from the Stripe session');
            }

            // Extract metadata from session
            const { userId, doctorId, timeSlot, ticketPrice, paymentMethod } = session.metadata;

            // Parse timeSlot (because it was stored as a string in metadata)
            const parsedTimeSlot = JSON.parse(timeSlot);

            // Create new booking in database
            const newBooking = new Booking({
                doctor: doctorId,
                user: userId,
                ticketPrice,
                paymentMethod,
                isPaid: true, // Mark as paid since Stripe confirmed payment
                timeSlot: parsedTimeSlot,
            });
            await newBooking.save();

            // Remove booked time slot from doctor's available slots
            await Doctor.updateOne({ _id: doctorId }, { $pull: { timeSlots: parsedTimeSlot } });

            // Fetch user and doctor info for sending email
            const user = await User.findById(userId);
            const doctor = await Doctor.findById(doctorId);

            if (!user || !doctor) {
                throw new Error('User or Doctor not found');
            }

            // Send confirmation email
            await sendConfirmationEmail(user.email, {
                userName: user.fullname,
                doctorName: doctor.fullname,
                timeSlot: parsedTimeSlot,
                ticketPrice,
                paymentMethod,
                isPaid: true,
            });

            console.log('Booking confirmed and email sent successfully.');
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing Stripe webhook:', error);
        res.status(400).json({ success: false, message: 'Webhook error', error: error.message });
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

        const { timeSlot, paymentMethod } = req.body;

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${process.env.CLIENT_SITE_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/doctors/${doctor.id}`,
            customer_email: user.email,
            client_reference_id: req.params.doctorId,
            metadata: {
                userId: user._id.toString(),
                doctorId: doctor._id.toString(),
                timeSlot: JSON.stringify(timeSlot),
                ticketPrice: doctor.ticketPrice.toString(),
                paymentMethod,
            },
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

        res.status(200).json({ success: true, message: 'Transaction initiated', session });
    } catch (error) {
        console.error('Error in creating checkout session:', error);
        res.status(500).json({ success: false, message: 'Error in creating checkout session', error: error.message });
    }
};

// Update appointment status (e.g. cancelled, pending, done)
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
