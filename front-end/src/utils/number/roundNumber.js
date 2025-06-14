const roundNumber = (number, precision) => {
    const multiplier = Math.pow(10, precision);
    return Math.round(number * multiplier) / multiplier;
};

export default roundNumber;
