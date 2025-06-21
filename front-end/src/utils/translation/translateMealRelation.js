const translateMealRelation = (relation,t) => {
    if (!relation) return '';
    return t(`mealRelation.${relation}`, relation);
};

export default translateMealRelation;
