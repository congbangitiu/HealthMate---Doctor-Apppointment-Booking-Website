import mailTransporter from '../utils/mailTransporter.js';
import Booking from '../Models/BookingSchema.js';
import Doctor from '../Models/DoctorSchema.js';
import formatDate from '../../front-end/src/utils/date-time/formatDate.js';
import convertTime from '../../front-end/src/utils/date-time/convertTime.js';
import cron from 'node-cron';

const generateAppointmentWrapper = (appointments, doctor) => {
    const rows = appointments
        .map(
            (appointment) => `
                <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px; background-color: #f9f9f9;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold;"> 
                        ${appointment.user.fullname}
                    </p>
                    <ul style="margin: 8px 0 0 16px; padding: 0; list-style-type: disc; font-size: 14px;">
                        <li><strong>Date:</strong> ${formatDate(appointment.timeSlot.day)}</li>
                        <li><strong>Time:</strong> ${convertTime(appointment.timeSlot.startingTime)} – ${convertTime(
                appointment.timeSlot.endingTime,
            )}</li>
                    </ul>
                </div>
            `,
        )
        .join('');

    return `
        <div style="font-family: 'Segoe UI', sans-serif; ">
            <p style="margin-bottom: 6px;">Dear Dr. ${doctor.fullname},</p>
            <p style="margin-bottom: 16px;">
                Here ${appointments.length > 1 ? 'are' : 'is'} the appointment${
                    appointments.length > 1 ? 's' : ''
                } booked today 
                <strong>(${formatDate(new Date())})</strong>:
            </p>
            ${rows}
            <p style="color: #000000; font-style: italic; margin-top: 20px">Best regards,</p>
            <strong style="color: #000000;">HealthMate Clinic</strong>
            <p style="color: #4e545f; font-style: italic">CONFIDENTIALITY NOTICE: This email is intended only for the person(s) named in the message body. Unless otherwise indicated, it contains information that is confidential, privileged, and/or exempt from disclosure under applicable law. If you have received this message in error, please notify the sender and delete the message.</p>
        </div>
    `;
};

const sendDailyDoctorDigestEmail = async () => {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));

    const doctors = await Doctor.find({}).lean();

    for (const doctor of doctors) {
        const appointments = await Booking.find({
            doctor: doctor._id,
            createdAt: { $gte: start, $lte: end },
        })
            .populate('user', '-password')
            .lean();

        if (appointments.length === 0) continue;

        const htmlBody = generateAppointmentWrapper(appointments, doctor);

        await mailTransporter.sendMail({
            from: `"HealthMate" <${process.env.EMAIL_USERNAME}>`,
            to: doctor.email,
            subject: 'HealthMate - Daily Appointments Digest',
            html: htmlBody,
        });
    }

    console.log('Daily digest emails sent');
};

// Exported function to initialize the cron job for sending daily doctor digest emails
export const initDoctorDigestMailCron = () => {
    cron.schedule('0 21 * * *', async () => {
        console.log('Running daily doctor digest email at 21:00');
        try {
            await sendDailyDoctorDigestEmail();
        } catch (error) {
            console.error('Failed to send daily doctor digest email:', error.message);
        }
    });
};

// Testing function to run the digest email every minute (for development purposes)
// export const initDoctorDigestMailCron = () => {
//     cron.schedule('* * * * *', async () => {
//         console.log('Running digest email every minute (for testing)');
//         try {
//             await sendDailyDoctorDigestEmail();
//         } catch (error) {
//             console.error('Failed:', error.message);
//         }
//     });
// };
