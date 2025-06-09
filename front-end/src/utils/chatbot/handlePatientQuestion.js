const SHIFT_LABELS = {
    Morning: 'morning shift (8:00 to 11:30)',
    Afternoon: 'afternoon shift (13:00 to 16:00)',
    Evening: 'evening shift (18:00 to 21:00)',
};

export const handleDoctorAvailabilityResponse = async ({
    userMessage,
    chatHistory,
    setIsThinking,
    generateBotResponse,
    handleDoctorScheduleQuery,
}) => {
    const doctor = await handleDoctorScheduleQuery(userMessage);
    if (!doctor) return false;

    const hasSchedules = Array.isArray(doctor.availableSchedules) && doctor.availableSchedules.length > 0;

    if (!hasSchedules) {
        const prompt = `
            A user asked about the availability of Dr. ${doctor.fullname}, but there are currently no working schedules recorded. 

            Please respond politely that Dr. ${doctor.fullname} currently has no registered working schedule.
            Suggest that the user check back later or explore other doctors in the same specialty on HealthMate.
            Keep the response short and professional.
        `;

        await generateBotResponse([...chatHistory, { role: 'user', text: prompt }]);
        setIsThinking(false);
        return true;
    }

    // Group by day for better formatting
    const scheduleSummary = doctor.availableSchedules
        .map((entry) => {
            const shiftDescriptions = entry.shifts.map((shift) => `**${SHIFT_LABELS[shift.trim()]}**`).join(', ');
            return `**${entry.day}** during the ${shiftDescriptions}`;
        })
        .join(' and ');

    const prompt = `
        A user asked about the working schedule of Dr. ${doctor.fullname}.

        Please respond with:
        1. A sentence like: "Dr. ${doctor.fullname} works on ${scheduleSummary}."
        2. A second sentence that politely invites the user to visit Dr. ${doctor.fullname}’s profile on HealthMate to view detailed time slots and book an appointment.

        Keep it friendly and professional, no more than 2 sentences total.
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

        const formatSchedule = (availableSchedules) => {
            if (!Array.isArray(availableSchedules) || availableSchedules.length === 0)
                return '**No schedule available**';
            return availableSchedules
                .map((entry) => {
                    const shifts = entry.shifts.map((shift) => `**${SHIFT_LABELS[shift.trim()]}**`).join(', ');
                    return `**${entry.day}** during the ${shifts}`;
                })
                .join(' and ');
        };

        const doctorInfoText = doctors
            .map((doctor, index) => {
                const scheduleSummary = formatSchedule(doctor.availableSchedules);
                return `${index + 1}. **Dr. ${doctor.fullname}** – Available: ${scheduleSummary}`;
            })
            .join('\n');

        const prompt = `
            User symptom: ${userMessage}  
            Mapped specialty: **${specialty}**

            Available doctors:  
            ${doctorInfoText || '**No available doctors at the moment.**'}

            Please recommend a suitable doctor based on the symptoms. Do not respond to specialties not listed in HealthMate.  
            Respond in 2–3 sentences max, focusing on:
                1. The matched specialty (bold)
                2. A doctor’s name and availability (bold both name and shifts)
                3. A short booking instruction (1 line max)
        `;

        await generateBotResponse([...chatHistory, { role: 'user', text: prompt }]).finally(() => setIsThinking(false));
        return true;
    }
};
