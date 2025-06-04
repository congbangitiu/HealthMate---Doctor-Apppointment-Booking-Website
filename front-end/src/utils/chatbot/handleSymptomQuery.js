import determineSpecialty from './determineSpecialty';
import { BASE_URL } from '../../../config';

const handleSymptomQuery = async (userMessage) => {
    const specialty = determineSpecialty(userMessage);
    if (!specialty) return null;

    // Fetch doctors from your API (you can customize this endpoint)
    const response = await fetch(`${BASE_URL}/doctors?specialty=${specialty}`);
    const data = await response.json();

    if (!data.success || !data.data.length) return { specialty, doctors: [] };

    return {
        specialty,
        doctors: data.data, 
    };
};

export default handleSymptomQuery;
