import { BASE_URL } from '../../../config';

const handleDoctorScheduleQuery = async (text) => {
    // Match Dr. + full name (max 3 words), stop at next word boundary
    const match = text.match(/Dr\.?\s+(([A-Z][a-zÀ-ỹ]+)(\s+[A-Z][a-zÀ-ỹ]+){0,2})\b/);

    if (!match) return null;

    const name = match[1].trim();

    const response = await fetch(`${BASE_URL}/doctors?query=${name}`);
    const data = await response.json();

    const normalize = (str) =>
        str
            .toLowerCase()
            .replace(/[^a-z\s]/gi, '')
            .trim();

    const matchedDoctor = data?.data?.find((doctor) => {
        const dbName = normalize(doctor.fullname);
        const queryName = normalize(name);
        return dbName.includes(queryName) || queryName.includes(dbName);
    });

    return matchedDoctor || null;
};

export default handleDoctorScheduleQuery;
