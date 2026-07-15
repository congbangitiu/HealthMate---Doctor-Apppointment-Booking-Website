// Phiên bản dùng riêng cho backend (không phụ thuộc i18next của front-end).
// Backend không khởi tạo i18next nên luôn định dạng theo 'en-US' (hour12) —
// giữ đúng hành vi trước đây khi import từ front-end.
const convertTime = (time) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));

    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export default convertTime;
