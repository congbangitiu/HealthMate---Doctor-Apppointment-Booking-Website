// Phiên bản dùng riêng cho backend (không phụ thuộc i18next của front-end).
// Backend không khởi tạo i18next nên luôn định dạng theo 'en-US' — giữ đúng
// hành vi trước đây khi import từ front-end.
const formatDate = (date, config) => {
    const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const options = config || defaultOptions;

    return new Date(date).toLocaleDateString('en-US', options);
};

export default formatDate;
