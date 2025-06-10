import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const mailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export default mailTransporter;
