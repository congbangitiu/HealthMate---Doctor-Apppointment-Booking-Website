import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Render (và nhiều PaaS) chặn cổng SMTP ra ngoài -> Gmail SMTP bị "Connection timeout".
// Gửi mail qua Brevo HTTP API (cổng 443, không bị chặn) thay cho SMTP.
// Giữ nguyên interface .sendMail(mailOptions[, callback]) để các nơi gọi cũ không phải đổi.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Chuyển 'Tên <email@x>' hoặc 'email@x' thành { name, email } cho Brevo.
const parseSender = (from) => {
    const fallback = process.env.EMAIL_SENDER || process.env.EMAIL_USERNAME;
    if (!from) return { email: fallback };
    const match = String(from).match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
    if (match) return { name: (match[1] || '').trim() || undefined, email: match[2].trim() };
    return { email: String(from).trim() };
};

const toRecipients = (to) =>
    (Array.isArray(to) ? to : String(to).split(','))
        .map((e) => e.trim())
        .filter(Boolean)
        .map((email) => ({ email }));

const sendMail = async (mailOptions, callback) => {
    try {
        const payload = {
            sender: parseSender(mailOptions.from),
            to: toRecipients(mailOptions.to),
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
        };
        if (mailOptions.text) payload.textContent = mailOptions.text;

        const { data } = await axios.post(BREVO_API_URL, payload, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
            timeout: 15000,
        });

        const info = { response: 'OK', messageId: data.messageId };
        if (callback) return callback(null, info);
        return info;
    } catch (error) {
        const err = new Error(error.response?.data?.message || error.message || 'Failed to send email');
        if (callback) return callback(err);
        throw err;
    }
};

export default { sendMail };
