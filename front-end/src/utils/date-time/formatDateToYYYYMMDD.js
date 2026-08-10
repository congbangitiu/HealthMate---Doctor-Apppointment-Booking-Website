const formatDateToYYYYMMDD = (date) => {
    const normalizedDate = new Date(date);
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export default formatDateToYYYYMMDD;
