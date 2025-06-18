import i18n from 'i18next';

const convertTime = (time) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));

    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: i18n.language !== 'vi',
    };

    return new Intl.DateTimeFormat(locale, options).format(date);
};

export default convertTime;
