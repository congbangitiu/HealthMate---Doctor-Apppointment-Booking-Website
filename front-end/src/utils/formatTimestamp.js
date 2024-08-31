const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    const isSameDay =
        date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCDate() === now.getUTCDate();

    if (isSameDay) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh',
        };
        return date.toLocaleString('en-GB', options);
    } else {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Asia/Ho_Chi_Minh',
        };
        return date.toLocaleDateString('en-GB', options);
    }
};

export default formatTimestamp;
