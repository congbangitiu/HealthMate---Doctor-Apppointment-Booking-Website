const truncateNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 8) {
        throw new Error('Phone number is too short');
    }

    const start = phoneNumber.slice(0, 3);
    const end = phoneNumber.slice(-2);

    return `${start}*****${end}`;
};

export default truncateNumber;
