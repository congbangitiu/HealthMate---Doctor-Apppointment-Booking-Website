const translateAppointmentStatus = (status, t) => {
    const translations = {
        pending: t('status.pending'),
        done: t('status.done'),
        cancelled: t('status.cancelled'),
    };

    return translations[status] || status;
};

export default translateAppointmentStatus;
