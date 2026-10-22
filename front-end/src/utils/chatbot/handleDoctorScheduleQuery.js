import { BASE_URL } from '../../../config';

const handleDoctorScheduleQuery = async (text) => {
    // Normalize the input text to make it easier to match with doctor names
    const normalize = (str) =>
        (typeof str === 'string' ? str : '')
            .toLowerCase()
            .replace(/[^a-zà-ỹ\s]/gi, '')
            .replace(/\b(dr|doctor)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();

    const cleanedText = normalize(text);
    const inputWords = cleanedText.split(/\s+/);

    const response = await fetch(`${BASE_URL}/doctors`);
    if (!response.ok) {
        throw new Error(`Failed to fetch doctors (HTTP ${response.status})`);
    }
    const data = await response.json();

    const doctors = data?.data || [];

    // Prefer a complete name phrase before falling back to any matching name word.
    const fullNameMatch = doctors.find((doctor) => {
        const name = normalize(doctor?.fullname);
        return name && ` ${cleanedText} `.includes(` ${name} `);
    });
    if (fullNameMatch) return fullNameMatch;

    const matchedDoctor = doctors.find((doctor) => {
        const doctorName = normalize(doctor?.fullname);
        if (!doctorName) return false;
        const nameWords = doctorName.split(/\s+/);

        // Check if any word in the doctor's name matches any word in the input text
        return nameWords.some((word) => inputWords.includes(word));
    });

    return matchedDoctor || null;
};

export default handleDoctorScheduleQuery;
