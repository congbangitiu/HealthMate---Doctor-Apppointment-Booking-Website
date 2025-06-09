const formatListResponse = (text) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\*/g, '   *')
        .replace(/\n-/g, '   -')
        .replace(/\*\s/g, '   * ')
        .replace(/-\s/g, '   - ')
        .replace(/\n(\d+)\.\s*(.*)/g, '\n   <strong>$1.</strong> $2');
};

export default formatListResponse;
