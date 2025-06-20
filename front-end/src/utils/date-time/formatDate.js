import i18n from 'i18next';

const formatDate = (date, config) => {
    const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const options = config || defaultOptions;
    const locale = i18n.language || 'en';

    return new Date(date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', options);
};

export default formatDate;
