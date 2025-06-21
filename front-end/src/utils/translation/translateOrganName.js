const organTranslations = {
    Liver: 'Gan',
    Gallbladder: 'Túi mật',
    Pancreas: 'Tụy',
    'Right Kidney': 'Thận phải',
    'Left Kidney': 'Thận trái',
    Spleen: 'Lách',
};

const translateOrganName = (organ, i18n) => {
    if (i18n.language === 'vi') {
        return organTranslations[organ] || organ;
    }
    return organ;
};

export default translateOrganName;
