const translateTimeOfDay = (time, t) => {
    if (!time) return '';

    return time
        .split(',')
        .map((tVal) => t(`timeOfDay.${tVal.trim()}`, tVal.trim()))
        .join(', ');
};
export default translateTimeOfDay;
