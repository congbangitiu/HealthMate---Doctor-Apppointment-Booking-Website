import { BASE_URL } from '../../../config';

const handleDoctorScheduleQuery = async (text) => {
    // Normalize the input text to make it easier to match with doctor names
    const normalize = (str) =>
        str
            .toLowerCase()
            .replace(/[^a-zà-ỹ\s]/gi, '')
            .replace(/\b(dr|doctor)\b/g, '')
            .trim();

    const cleanedText = normalize(text);
    const inputWords = cleanedText.split(/\s+/);

    const response = await fetch(`${BASE_URL}/doctors`);
    const data = await response.json();

    const doctors = data?.data || [];

    const matchedDoctor = doctors.find((doctor) => {
        const doctorName = normalize(doctor.fullname);
        const nameWords = doctorName.split(/\s+/);

        // Check if any word in the doctor's name matches any word in the input text
        return nameWords.some((word) => inputWords.includes(word));
    });

    return matchedDoctor || null;
};

export default handleDoctorScheduleQuery;
