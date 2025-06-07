const getNextDateForDay = (dayName) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayIndex = today.getDay(); // 0–6
    const targetIndex = dayNames.indexOf(dayName);

    let diff = targetIndex - todayIndex;
    if (diff < 0) diff += 7;

    const nextDate = new Date();
    nextDate.setDate(today.getDate() + diff);

    return nextDate.toISOString().split('T')[0];
};

export default getNextDateForDay;
