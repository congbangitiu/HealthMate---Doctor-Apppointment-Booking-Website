import symptomToSpecialty from '../../assets/data/chatbot/symptomToSpecialty.js';

const determineSpecialty = (text) => {
    const input = text.toLowerCase();
    let bestMatch = null;

    for (const keyword in symptomToSpecialty) {
        const normalizedKeyword = keyword.toLowerCase();

        // Exact match
        if (input.includes(normalizedKeyword)) {
            return symptomToSpecialty[keyword];
        }

        // Fallback: check if input includes any individual word from the keyword
        const keywordParts = normalizedKeyword.split(' ');
        for (const part of keywordParts) {
            if (part.length > 3 && input.includes(part)) {
                bestMatch = symptomToSpecialty[keyword];
                break; // stop on first match
            }
        }
    }

    return bestMatch;
};

export default determineSpecialty;
