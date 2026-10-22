import i18n from 'i18next';

const convertTime = (time) => {
    if (typeof time !== 'string' || !/^\d{1,2}:\d{1,2}$/.test(time)) return null;
    const [hour, minute] = time.split(':').map(Number);
    if (hour > 23 || minute > 59) return null;
    const date = new Date();
    date.setHours(hour, minute);

    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: i18n.language !== 'vi',
    };

    return new Intl.DateTimeFormat(locale, options).format(date);
};

export default convertTime;
