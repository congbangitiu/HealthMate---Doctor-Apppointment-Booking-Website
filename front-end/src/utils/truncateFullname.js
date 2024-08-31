const truncateFullname = (fullname) => {
    const nameParts = fullname.trim().split(' ');
    return nameParts.slice(-2).join(' ');
};

export default truncateFullname;
