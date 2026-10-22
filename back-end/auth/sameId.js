// Support both populated references and MongoDB ObjectIds without comparing objects by coercion.
const referenceId = (value) => {
    const id = value?._id ?? value;
    if (typeof id === 'string') return /^[a-f\d]{24}$/i.test(id) ? id.toLowerCase() : id || null;
    if (id && typeof id.toHexString === 'function') return id.toHexString();
    return null;
};

export const sameId = (left, right) => {
    const id = referenceId(left);
    return id !== null && id === referenceId(right);
};
