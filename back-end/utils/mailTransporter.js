import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const mailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // TLS ngầm — nhiều host cho 465 nhưng chặn 587
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
    // Fail nhanh thay vì treo lâu khi cổng SMTP bị chặn.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
});

export default mailTransporter;
