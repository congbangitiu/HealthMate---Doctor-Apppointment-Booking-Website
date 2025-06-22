const translateOrganName = (organ, t) => {
    if (!organ) return '';
    return t(`organ.${organ}`, organ);
};

export default translateOrganName;
