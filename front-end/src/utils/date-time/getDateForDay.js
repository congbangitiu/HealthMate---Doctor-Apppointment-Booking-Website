import formatDateToYYYYMMDD from './formatDateToYYYYMMDD';

const getDateForDay = (dayName) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayIndex = today.getDay(); // 0–6
    const targetIndex = dayNames.indexOf(dayName);
    if (targetIndex === -1) return null;

    let diff = targetIndex - todayIndex;
    if (diff < 0) diff += 7;

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);

    return formatDateToYYYYMMDD(nextDate);
};

export default getDateForDay;
