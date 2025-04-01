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

const sendBookingConfirmationEmail = async (userEmail, bookingInfo) => {
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

// Create checkout session when user chooses cash payment
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
            unread: true,
        });

        // Save booking to database
        const savedBooking = await newBooking.save();

        // Remove the booked timeSlot from the doctor's available slots
        await Doctor.updateOne({ _id: doctorId }, { $pull: { timeSlots: timeSlot } });

        // Increment the total number of patients for the doctor
        await Doctor.updateOne({ _id: doctorId }, { $inc: { totalPatients: 1 } });

        // Send confirmation email to user
        await sendBookingConfirmationEmail(user.email, {
            userName: user.fullname,
            doctorName: doctor.fullname,
            timeSlot,
            ticketPrice,
            paymentMethod,
            isPaid: false,
        });

        // Emit event to notify the doctor in real-time
        req.io.to(doctor._id.toString()).emit('booking-notification', {
            bookingId: savedBooking._id,
            user: {
                id: user._id,
                fullname: user.fullname,
                photo: user.photo,
            },
            timeSlot,
            ticketPrice,
            paymentMethod,
            isPaid: false,
            unread: true,
            status: 'pending',
            createdAt: savedBooking.createdAt,
        });

        res.status(201).json({ success: true, message: 'Booking created successfully', booking: savedBooking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Error creating booking', error: error.message });
    }
};

const sendReExaminationConfirmationEmail = async (userEmail, bookingInfo) => {
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
            subject: 'HealthMate - Re-Examination Appointment Confirmation',
            html: `
                <p style="color: #000000;">Dear ${bookingInfo.userName},</p>
                <p style="color: #000000;">This is a re-examination appointment scheduled by your doctor, ${
                    bookingInfo.doctorName
                }, with the following details:</p>
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
                        <td>Free (Re-examination)</td> 
                    </tr>
                </table>
                <p style="color: #000000;"><strong>Please make sure to arrive on time for your re-examination appointment. You are requested to return earlier if you experience any abnormal symptoms. The re-examination should be conducted within 10 working days from the date of this appointment, unless otherwise specified.</strong></p>
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

export const createReExaminationBooking = async (req, res) => {
    try {
        const { doctorId, userId, timeSlot, currentBookingId } = req.body;

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

        // Check if current booking exists
        const currentBooking = await Booking.findById(currentBookingId);
        if (!currentBooking) {
            return res.status(404).json({ success: false, message: 'Current booking not found' });
        }

        // Update nextAppointmentTimeSlot of the current booking
        currentBooking.nextAppointment = {
            timeSlot: timeSlot,
        };
        await currentBooking.save();

        // Create new re-examination booking
        const newBooking = new Booking({
            doctor: doctorId,
            user: userId,
            ticketPrice: '0',
            paymentMethod: 'free',
            isPaid: true,
            timeSlot,
            unread: true,
            isReExamination: true,
            parentBooking: currentBookingId,
        });

        // Save the new booking to database
        const savedBooking = await newBooking.save();

        // Increment the total number of patients for the doctor
        await Doctor.updateOne({ _id: doctorId }, { $inc: { totalPatients: 1 } });

        // Send confirmation email to user
        await sendReExaminationConfirmationEmail(user.email, {
            userName: user.fullname,
            doctorName: doctor.fullname,
            timeSlot,
            ticketPrice: '0',
        });

        // Emit event to notify the user in real-time
        req.io.to(user._id.toString()).emit('re-examination-notification', {
            bookingId: savedBooking._id,
            doctor: {
                id: doctor._id,
                fullname: doctor.fullname,
                photo: doctor.photo,
            },
            timeSlot: timeSlot,
            createdAt: savedBooking.createdAt,
            type: 're-examination',
            status: 'scheduled',
            isReExamination: true,
        });

        res.status(201).json({
            success: true,
            message: 'Re-examination booking created successfully',
            booking: savedBooking,
        });
    } catch (error) {
        console.error('Error creating re-examination booking:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating re-examination booking',
            error: error.message,
        });
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
                unread: true,
                session: session.id,
            });

            const savedBooking = await newBooking.save();

            // Remove booked time slot from doctor's available slots
            await Doctor.updateOne({ _id: doctorId }, { $pull: { timeSlots: parsedTimeSlot } });

            // Increment the total number of patients for the doctor
            await Doctor.updateOne({ _id: doctorId }, { $inc: { totalPatients: 1 } });

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

            // Emit event to notify the doctor in real-time
            req.io.to(doctor._id.toString()).emit('booking-notification', {
                bookingId: savedBooking._id,
                user: {
                    id: user._id,
                    fullname: user.fullname,
                    photo: user.photo,
                },
                timeSlot: parsedTimeSlot,
                ticketPrice,
                paymentMethod,
                isPaid: true,
                unread: true,
                status: 'pending',
                createdAt: savedBooking.createdAt,
            });
        }

        res.status(200).json({ received: true });
    } catch (error) {
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
        const appointment = await Booking.findById(id).populate('doctor').populate('user');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        // Update new state and save change history
        appointment.status = status;
        appointment.statusHistory.push({ status, timestamp: new Date() });

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

            // Send real-time notifications to your doctor
            req.io.to(doctor._id.toString()).emit('cancelled-notification', {
                appointmentId: appointment._id,
                user: {
                    id: appointment.user._id,
                    fullname: appointment.user.fullname,
                    photo: appointment.user.photo,
                },
                timeSlot: appointment.timeSlot,
                status,
                createdAt: new Date().toISOString(),
            });
        }

        await appointment.save();

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

// Update nextAppointmentTimeSlot of current appointment and timeSlot of the re-examination appointment
export const updateNextAppointmentTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextAppointmentTimeSlot } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const validateTimeSlot = (slot) => {
            if (!slot.day || !slot.startingTime || !slot.endingTime) {
                throw new Error('Invalid time slot: day, startingTime, and endingTime are required');
            }
            if (slot.startingTime >= slot.endingTime) {
                throw new Error('Starting time must be earlier than ending time');
            }
            const today = new Date().toISOString().split('T')[0];
            if (slot.day < today) {
                throw new Error('Date must be in the future');
            }
        };

        // Update next Appointment Time Slot and follow-up appointment if any
        if (booking.nextAppointment) {
            validateTimeSlot(nextAppointmentTimeSlot);

            booking.nextAppointment = {
                timeSlot: nextAppointmentTimeSlot,
                pdfInfo: booking.nextAppointment.pdfInfo || null,
            };

            // Find related follow-up appointment (based on parentBooking)
            const reExaminationBooking = await Booking.findOne({
                parentBooking: id,
                isReExamination: true,
            });

            if (reExaminationBooking) {
                // Update the timeSlot of the follow-up appointment
                reExaminationBooking.timeSlot = nextAppointmentTimeSlot;
                await reExaminationBooking.save();
            }
        }

        const updatedBooking = await booking.save();

        res.status(200).json({ success: true, message: 'Booking updated successfully', data: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Error updating booking', error: error.message });
    }
};

// Save PDF link to the next appointment of the parent booking
export const savePDFLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { pdfUrl, publicId } = req.body;

        if (!pdfUrl || !publicId) {
            return res.status(400).json({
                success: false,
                message: 'PDF URL and public ID are required',
            });
        }

        const currentBooking = await Booking.findById(id);
        if (!currentBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            {
                $set: {
                    'nextAppointment.pdfInfo': {
                        url: pdfUrl,
                        publicId: publicId,
                        updatedAt: new Date(),
                    },
                    'nextAppointment.timeSlot': currentBooking.nextAppointment?.timeSlot || null,
                },
            },
            { new: true, runValidators: true },
        );

        res.json({
            success: true,
            message: 'PDF link saved successfully',
            data: updatedBooking,
        });
    } catch (error) {
        console.error('Error', error);
        res.status(500).json({
            success: false,
            message: 'Error saving PDF link',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

// Get appointment by session ID (used when user pays with Stripe)
export const getAppointmentBySessionId = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Find appointment by sessionId from Stripe
        const appointment = await Booking.findOne({ session: sessionId }).populate('doctor user');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({ success: true, appointment });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointment', error: error.message });
    }
};

// Get appointment by ID (used when user pays with Cash)
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Booking.findById(id).populate('doctor user');

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({ success: true, appointment });
    } catch (error) {
        console.error('Error fetching appointment by ID:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointment', error: error.message });
    }
};

// Count unread appointments for a doctor
export const countUnreadAppointments = async (req, res) => {
    try {
        const unreadBookings = await Booking.countDocuments({
            doctor: req.params.doctorId,
            unread: true,
            isReExamination: false,
        });

        res.json({ unreadCount: unreadBookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread bookings', error });
    }
};

// Mark appointment as read
export const markAppointmentAsRead = async (req, res) => {
    try {
        await Booking.updateMany({ doctor: req.params.doctorId, unread: true }, { $set: { unread: false } });

        res.json({ message: 'Marked all unread bookings as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking bookings as read', error });
    }
};
