const translateSubspecialtyName = (subspecialtyEn, i18n) => {
    if (i18n.language === 'en') return subspecialtyEn;

    const specialtiesEn = i18n.getResource('en', 'specialties');
    const specialtiesVi = i18n.getResource('vi', 'specialties');

    if (!specialtiesEn || !specialtiesVi) return subspecialtyEn;

    let matchedKey = null;
    for (const [key, specialty] of Object.entries(specialtiesEn)) {
        if (specialty.subspecialties?.some((sub) => sub.name === subspecialtyEn)) {
            matchedKey = key;
            break;
        }
    }

    if (!matchedKey) return subspecialtyEn;

    const enSubList = specialtiesEn[matchedKey]?.subspecialties || [];
    const viSubList = specialtiesVi[matchedKey]?.subspecialties || [];

    for (let i = 0; i < enSubList.length; i++) {
        if (enSubList[i].name === subspecialtyEn) {
            return viSubList[i]?.name || subspecialtyEn;
        }
    }

    return subspecialtyEn;
};

export default translateSubspecialtyName;
