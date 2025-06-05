import formatDate from '../formatDate';
import convertTime from '../convertTime';
import { BASE_URL } from '../../../config';

export const handleDoctorTodayAppointments = async ({
    userMessage,
    role,
    chatHistory,
    setIsThinking,
    generateBotResponse,
    token,
}) => {
    if (role !== 'doctor') return false;

    const lower = userMessage.toLowerCase();
    const isAsking = lower.includes('appointment') && (lower.includes('today') || lower.includes('tomorrow'));

    if (!isAsking) return false;

    let queryDate = new Date();
    let label = 'today';

    if (lower.includes('tomorrow')) {
        queryDate.setDate(queryDate.getDate() + 1);
        label = 'tomorrow';
    }

    const dateStr = queryDate.toISOString().split('T')[0];

    try {
        const response = await fetch(`${BASE_URL}/doctors/appointments/my-appointments?day=${dateStr}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        const appointments = result?.data || [];

        const appointmentList = appointments
            .map((appt) => {
                const patientName = appt.user?.fullname || 'Anonymous';
                const timeRange = `${convertTime(appt.timeSlot.startingTime)} – ${convertTime(
                    appt.timeSlot.endingTime,
                )}`;
                return `• ${timeRange}: ${patientName}`;
            })
            .join('\n');

        const prompt =
            appointments.length === 0
                ? `
                    A doctor asked about their schedule for ${label} (${formatDate(
                      dateStr,
                  )}), but there are no appointments recorded.

                    Please reply politely:
                    - Inform the doctor that they have no appointments for ${label}
                    - Optionally wish them a productive day
                `
                : `
                    A doctor wants to know what appointments they have scheduled for ${label} (${formatDate(
                      dateStr,
                  )}). Make sure the format of appointment list has bullet points and line breaks like when I passed it in.

                    Here is the list of appointments:
                    ${appointmentList}

                    Please respond in a professional tone, no need to say greatings or salutations, just provide the information clearly:
                    1. A summary sentence saying how many appointments are scheduled
                    2. List the appointments clearly using bullet points (as above)
                    3. Suggest the doctor can view full details in the Appointments tab of the Dashboard.
                `;

        await generateBotResponse([...chatHistory, { role: 'user', text: prompt }]);
        setIsThinking(false);
        return true;
    } catch (error) {
        console.error('Failed to fetch appointments:', error);
        await generateBotResponse([
            ...chatHistory,
            {
                role: 'user',
                text: 'Sorry, I was unable to retrieve your appointments at this time. Please try again later.',
            },
        ]);
        setIsThinking(false);
        return true;
    }
};
