const copy = {
    en: {
        subject: '[HealthMate] Access your support requests',
        greeting: 'Dear Customer,',
        intro: 'We received a request to access the support requests associated with this email address.',
        action: 'Use the button below to view their status and continue your conversation with the HealthMate support team.',
        button: 'View support requests',
        expiry: 'This link expires in 15 minutes and can only be used once. Please do not share it with anyone.',
        ignore: 'If you did not request this email, you can safely ignore it. Your support requests remain unchanged.',
        closing: 'Best regards,',
        team: 'The HealthMate team',
        fallback: 'If the button does not work, open this link:',
    },
    vi: {
        subject: '[HealthMate] Truy cập lại yêu cầu hỗ trợ của bạn',
        greeting: 'Kính gửi Quý khách,',
        intro: 'Chúng tôi nhận được yêu cầu truy cập lại các yêu cầu hỗ trợ liên kết với email này.',
        action: 'Nhấn nút bên dưới để xem trạng thái yêu cầu và tiếp tục trao đổi với đội ngũ HealthMate.',
        button: 'Xem yêu cầu hỗ trợ',
        expiry: 'Liên kết có hiệu lực trong 15 phút và chỉ sử dụng được một lần. Vui lòng không chia sẻ liên kết này với người khác.',
        ignore: 'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email. Các yêu cầu hỗ trợ của bạn vẫn được giữ nguyên.',
        closing: 'Trân trọng,',
        team: 'Đội ngũ HealthMate',
        fallback: 'Nếu nút không hoạt động, hãy mở liên kết này:',
    },
};
const escape = (value) =>
    value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const guestRecoveryMail = (language, link) => {
    const text = copy[language] || copy.en;
    const url = escape(link);
    return {
        subject: text.subject,
        html: `<!doctype html><html lang="${
            language === 'vi' ? 'vi' : 'en'
        }"><body style="margin:0;background:#f5f8f8;font-family:Arial,sans-serif;color:#20353b;line-height:1.6">
        <div style="max-width:560px;margin:24px auto;padding:28px;background:white;border:1px solid #e0e8e8;border-radius:8px">
            <p style="margin-top:0">${text.greeting}</p><p>${text.intro}</p><p>${text.action}</p>
            <p style="margin:28px 0"><a href="${url}" style="display:inline-block;padding:12px 20px;background:#00b5b5;color:white;border-radius:6px;text-decoration:none">${
                text.button
            }</a></p>
            <p>${text.expiry}</p><p>${text.ignore}</p><p>${text.closing}<br><strong>${text.team}</strong></p>
            <p style="font-size:13px;color:#65757b;overflow-wrap:anywhere">${
                text.fallback
            }<br><a href="${url}">${url}</a></p>
        </div></body></html>`,
    };
};
