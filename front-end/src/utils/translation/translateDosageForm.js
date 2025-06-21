const translateDosageForm = (form, t) => {
    if (!form) return '';
    return t(`dosageForm.${form}`, form);
};

export default translateDosageForm;
