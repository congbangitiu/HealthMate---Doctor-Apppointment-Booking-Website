// Phiên bản dùng riêng cho backend (không phụ thuộc i18next của front-end).
// Backend không khởi tạo i18next nên luôn định dạng theo 'en-US' (hour12) —
// giữ đúng hành vi trước đây khi import từ front-end.
const convertTime = (time) => {
    if (typeof time !== 'string' || !/^\d{1,2}:\d{1,2}$/.test(time)) return null;
    const [hour, minute] = time.split(':').map(Number);
    if (hour > 23 || minute > 59) return null;
    const date = new Date();
    date.setHours(hour, minute);

    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export default convertTime;
