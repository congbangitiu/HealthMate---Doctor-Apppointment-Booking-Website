const formatTimestamp = (timestamp, formatType = 'auto') => {
    const date = new Date(timestamp);
    const now = new Date();

    const isSameDay =
        date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCDate() === now.getUTCDate();

    const optionsTime = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh',
    };

    const optionsDate = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
    };

    const optionsDateTime = {
        ...optionsDate,
        ...optionsTime,
    };

    if (isSameDay) {
        return date.toLocaleTimeString('en-GB', optionsTime);
    } else {
        if (formatType === 'date') {
            return date.toLocaleDateString('en-GB', optionsDate);
        } else if (formatType === 'datetime') {
            return date.toLocaleString('en-GB', optionsDateTime);
        } else {
            throw new Error('Invalid formatType. Use "date" or "datetime".');
        }
    }
};

export default formatTimestamp;
