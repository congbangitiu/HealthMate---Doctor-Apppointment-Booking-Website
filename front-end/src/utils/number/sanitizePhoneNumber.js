export const sanitizePhoneNumber = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\D/g, '');
};