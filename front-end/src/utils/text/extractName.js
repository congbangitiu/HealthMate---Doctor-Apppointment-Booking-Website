/**
 * Extract the last two words from a full name string
 * @param {string} fullName - The full name to extract from
 * @returns {string} The last two words of the full name
 */
const extractName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return '';
    }

    const nameParts = fullName.trim().split(' ');
    const lastTwoWords = nameParts.slice(-2).join(' ');

    return lastTwoWords;
};

export default extractName;
