import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Render (free) chặn cổng SMTP -> Gmail SMTP bị timeout. Gửi qua Gmail API (HTTP/443)
// bằng OAuth2: mail đi từ chính tài khoản Gmail thật nên vào Inbox, không bị Deferred
// như IP dùng chung của dịch vụ bên thứ ba. Giữ interface .sendMail(mailOptions[, callback]).

const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground', // redirect URI dùng khi lấy refresh token
);
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Mã hoá subject an toàn UTF-8 (hỗ trợ tiếng Việt) theo RFC 2047.
const encodeSubject = (subject = '') => `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;

// Dựng message RFC 2822 rồi base64url cho Gmail API.
const buildRawMessage = ({ from, to, subject, html }) => {
    const sender = from || `"HealthMate" <${process.env.EMAIL_USERNAME}>`;
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    const body = Buffer.from(html || '', 'utf-8').toString('base64');

    const message = [
        `From: ${sender}`,
        `To: ${recipients}`,
        `Subject: ${encodeSubject(subject)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        body,
    ].join('\r\n');

    return Buffer.from(message, 'utf-8').toString('base64url');
};

const sendMail = async (mailOptions, callback) => {
    try {
        const raw = buildRawMessage(mailOptions);
        const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        const info = { response: 'OK', messageId: res.data.id };
        if (callback) return callback(null, info);
        return info;
    } catch (error) {
        const err = new Error(
            error?.response?.data?.error?.message || error?.errors?.[0]?.message || error?.message || 'Failed to send email',
        );
        if (callback) return callback(err);
        throw err;
    }
};

export default { sendMail };
