import formatDate from '../formatDate';
import convertTime from '../convertTime';

export const handleDoctorAvailabilityResponse = async ({
    userMessage,
    chatHistory,
    setIsThinking,
    generateBotResponse,
    handleDoctorScheduleQuery,
}) => {
    const doctor = await handleDoctorScheduleQuery(userMessage);

    if (!doctor) return false;

    const hasSlots = Array.isArray(doctor.timeSlots) && doctor.timeSlots.length > 0;

    if (!hasSlots) {
        const prompt = `
            A user asked about the availability of Dr. ${doctor.fullname}, but there are currently no time slots on record.

            Please respond politely, explaining that Dr. ${doctor.fullname} currently has no available schedule.
            Encourage the user to either:
                1. Check back later
                2. Consider choosing another doctor from the same specialty on HealthMate.
            Keep the response short and professional.
        `;

        return generateBotResponse([...chatHistory, { role: 'user', text: prompt }]).finally(() =>
            setIsThinking(false),
        );
    }

    const scheduleText = doctor.timeSlots
        .slice(0, 5) // Limit to 5 time slots
        .map((slot) => `• ${formatDate(slot.day)}: ${convertTime(slot.startingTime)} – ${convertTime(slot.endingTime)}`)
        .join('\n');

    const prompt = `
        A user wants to know the availability of Dr. ${doctor.fullname}.
        Please answer in the following format exactly, make sure the format of scheduleText has bullet points and line breaks like when I passed it in.
        
        This is the formatted response:
            Here are some available time slots of Dr. ${doctor.fullname}:
            ${scheduleText}
            Please visit Dr. ${doctor.fullname}’s profile on HealthMate to view the full schedule and book an appointment through our easy booking process.

        Please answer in no more than 2–3 sentences:
        1. Politely suggest that the user visit Dr. ${doctor.fullname}’s profile page on HealthMate to view the full schedule and book an appointment.
        2. Suggest how the user can book an appointment via HealthMate
    `;

    await generateBotResponse([...chatHistory, { role: 'user', text: prompt }]).finally(() => setIsThinking(false));
    return true;
};

export const handleSymptomBasedResponse = async ({
    userMessage,
    chatHistory,
    setIsThinking,
    generateBotResponse,
    handleSymptomQuery,
}) => {
    const symptomData = await handleSymptomQuery(userMessage);

    if (symptomData && symptomData.specialty) {
        const { specialty, doctors } = symptomData;

        const doctorInfoText = doctors
            .map((doctor, index) => {
                const slot = doctor.timeSlots?.[0];
                return `${index + 1}. Dr. ${doctor.fullname} – Available: ${slot?.day} ${slot?.startingTime}–${
                    slot?.endingTime
                }`;
            })
            .join('\n');

        const prompt = `
            User symptom: ${userMessage}
            Mapped specialty: ${specialty}

            Available doctors:
            ${doctorInfoText || 'No available doctors at the moment.'}

            Please recommend a suitable doctor based on the symptoms. Do not respond to specialties not listed in HealthMate
            Respond in 2–3 sentences max, focusing on:
                1. The matched specialty
                2. A doctor’s name and availability
                3. A short booking instruction
            Avoid over-explaining the specialty unless it's essential.
        `;

        await generateBotResponse([...chatHistory, { role: 'user', text: prompt }]).finally(() => setIsThinking(false));
        return true;
    }
};
