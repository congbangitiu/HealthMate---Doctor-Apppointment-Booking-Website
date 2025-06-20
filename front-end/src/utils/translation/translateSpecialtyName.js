const translateSpecialtyName = (specialtyNameEn, i18n) => {
    if (i18n.language === 'en') return specialtyNameEn;

    const specialtiesEn = i18n.getResource('en', 'specialties');
    const specialtiesVi = i18n.getResource('vi', 'specialties');

    for (const [key, value] of Object.entries(specialtiesEn || {})) {
        if (value.name === specialtyNameEn) {
            return specialtiesVi?.[key]?.name || specialtyNameEn;
        }
    }

    return specialtyNameEn;
};

export default translateSpecialtyName;
