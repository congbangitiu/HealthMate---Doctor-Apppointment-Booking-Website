const truncateParagraph = (paragraph) => {
    const words = paragraph.split(' ');

    if (words.length > 50) {
        return words.slice(0, 50).join(' ') + '...';
    }

    return paragraph;
};

export default truncateParagraph;
