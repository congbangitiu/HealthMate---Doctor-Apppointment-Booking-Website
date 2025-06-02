import cron from 'node-cron';
import Doctor from '../Models/DoctorSchema.js';
import { addDays, parseISO, formatISO, isBefore, startOfToday } from 'date-fns';

// Generate weekly time slots for all approved doctors
export const generateWeeklySlotsForAllDoctors = async () => {
    console.log('Starting automatic slot generation for new week...');

    try {
        // Only process approved doctors
        const doctors = await Doctor.find({ isApproved: 'approved' });
        const now = new Date();
        const nextWeek = addDays(now, 7);

        for (const doctor of doctors) {
            // Skip if doctor has no time slots defined
            if (!doctor.timeSlots || doctor.timeSlots.length === 0) continue;

            // Analyze existing slots to find working patterns
            const patterns = analyzeTimeSlotPatterns(doctor.timeSlots);

            // Generate new slots for next 7 days
            const newSlots = [];

            // Create slots for each day in next week
            for (let day = 1; day <= 7; day++) {
                const targetDate = addDays(now, day);
                const dayOfWeek = targetDate.getDay(); // 0 (Sunday) - 6 (Saturday)

                // Add slots matching this day of week
                patterns.forEach((pattern) => {
                    if (pattern.dayOfWeek === dayOfWeek) {
                        newSlots.push({
                            day: formatISO(targetDate, { representation: 'date' }), // Format as 'YYYY-MM-DD'
                            startingTime: pattern.startingTime,
                            endingTime: pattern.endingTime,
                        });
                    }
                });
            }

            // Update doctor's timeSlots avoiding duplicates
            if (newSlots.length > 0) {
                const existingDates = doctor.timeSlots.map((slot) => slot.day);
                const uniqueNewSlots = newSlots.filter((slot) => !existingDates.includes(slot.day));

                await Doctor.findByIdAndUpdate(
                    doctor._id,
                    { $push: { timeSlots: { $each: uniqueNewSlots } } },
                    { new: true },
                );

                // console.log(`Added ${uniqueNewSlots.length} slots for doctor ${doctor._id}`);
            }
        }

        console.log('Completed automatic slot generation');
    } catch (error) {
        console.error('Error in automatic slot generation:', error);
    }
};

// Remove expired time slots for all doctors
export const removeExpiredSlotsForAllDoctors = async () => {
    console.log('Starting to remove expired slots...');
    try {
        const doctors = await Doctor.find({ isApproved: 'approved' });
        const today = startOfToday();

        for (const doctor of doctors) {
            if (!doctor.timeSlots || doctor.timeSlots.length === 0) continue;

            const originalCount = doctor.timeSlots.length;
            doctor.timeSlots = doctor.timeSlots.filter((slot) => {
                const slotDate = parseISO(slot.day);
                return !isBefore(slotDate, today);
            });

            const removedCount = originalCount - doctor.timeSlots.length;

            if (removedCount > 0) {
                await doctor.save();
                // console.log(`Removed ${removedCount} expired slots for doctor ${doctor._id}`);
            }
        }

        console.log('Completed removing expired slots.');
    } catch (error) {
        console.error('Error removing expired slots:', error);
    }
};

// Analyze existing time slots to find working patterns
const analyzeTimeSlotPatterns = (timeSlots) => {
    const patterns = [];
    const seenPatterns = new Set(); // To avoid duplicates

    timeSlots.forEach((slot) => {
        const date = parseISO(slot.day);
        const dayOfWeek = date.getDay(); // Get day of week (0-6)
        const patternKey = `${dayOfWeek}-${slot.startingTime}-${slot.endingTime}`;

        // Add unique patterns only
        if (!seenPatterns.has(patternKey)) {
            seenPatterns.add(patternKey);
            patterns.push({
                dayOfWeek, // 0 (Sunday) to 6 (Saturday)
                startingTime: slot.startingTime, // e.g. "08:00"
                endingTime: slot.endingTime, // e.g. "11:30"
            });
        }
    });

    return patterns;
};

// Initialize the daily slot maintenance cron job
export const initSlotGenerationCron = () => {
    console.log('Initializing daily cron job for slot maintenance');

    // Cron job: Every day at 00:00
    cron.schedule(
        '0 0 * * *',
        async () => {
            console.log('Daily task: Remove expired slots and generate new slots...');
            await removeExpiredSlotsForAllDoctors();
            await generateWeeklySlotsForAllDoctors();
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        },
    );
};

// Test mode: Run the slot generation per minute
// export const initSlotGenerationCron = () => {
//     console.log('Initializing daily cron job for slot maintenance');

//     cron.schedule(
//         '* * * * *',
//         async () => {
//             console.log('Test mode: running cron task every minute...');
//             await removeExpiredSlotsForAllDoctors();
//             await generateWeeklySlotsForAllDoctors();
//         },
//         {
//             timezone: 'Asia/Ho_Chi_Minh',
//         },
//     );
// };
