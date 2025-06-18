import i18n from 'i18next';

const formatTimeAgo = (startingTime) => {
    const now = new Date();
    const startingDate = new Date(startingTime);
    const diffInSeconds = Math.floor((now - startingDate) / 1000);

    const t = i18n.t;

    if (diffInSeconds < 60) {
        return t('timeAgo.now', { ns: 'notification' });
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return t('timeAgo.minutes', {
            count: diffInMinutes,
            ns: 'notification',
        });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return t('timeAgo.hours', {
            count: diffInHours,
            ns: 'notification',
        });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return t('timeAgo.days', {
            count: diffInDays,
            ns: 'notification',
        });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return t('timeAgo.months', {
            count: diffInMonths,
            ns: 'notification',
        });
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return t('timeAgo.years', {
        count: diffInYears,
        ns: 'notification',
    });
};

export default formatTimeAgo;
