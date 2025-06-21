const translateGender = (gender, t) => {
    if (!gender) return '';
    return t(`gender.${gender}`, gender);
};

export default translateGender;
