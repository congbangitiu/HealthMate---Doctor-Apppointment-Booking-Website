import cron from 'node-cron';
import Doctor from '../Models/DoctorSchema.js';
import { addDays, parseISO, isBefore, startOfToday } from 'date-fns';

// Generate weekly time slots for all approved doctors
const SHIFT_RANGES = {
    morning: { start: '08:00', end: '11:30' },
    afternoon: { start: '13:00', end: '16:00' },
    evening: { start: '18:00', end: '21:00' },
};

const getTimeRangesForShift = (shift) => {
    const range = SHIFT_RANGES[shift];
    if (!range) return [];

    const { start, end } = range;
    const ranges = [];

    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    while (h < endH || (h === endH && m < endM)) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        m += 30;
        if (m >= 60) {
            h += 1;
            m -= 60;
        }
        const endTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        ranges.push({ start: startTime, end: endTime });
    }

    return ranges;
};

export const generateWeeklySlotsForAllDoctors = async () => {
    console.log('Starting automatic slot generation for new week...');

    try {
        const doctors = await Doctor.find({ isApproved: 'approved' });
        const now = new Date();
        const nextWeek = addDays(now, 7);

        for (const doctor of doctors) {
            if (!doctor.availableSchedules || doctor.availableSchedules.length === 0) continue;

            const newSlots = [];

            for (const schedule of doctor.availableSchedules) {
                const slotDate = new Date(schedule.day);

                if (slotDate >= now && slotDate <= nextWeek) {
                    for (const shift of schedule.shifts) {
                        const normalizedShift = shift.toLowerCase().trim();
                        const timeRanges = getTimeRangesForShift(normalizedShift);

                        timeRanges.forEach((range) => {
                            newSlots.push({
                                day: schedule.day,
                                startingTime: range.start,
                                endingTime: range.end,
                            });
                        });
                    }
                }
            }

            const existingSlots = doctor.timeSlots || [];
            const newUniqueSlots = newSlots.filter((slot) => {
                return !existingSlots.some(
                    (existing) =>
                        existing.day === slot.day &&
                        existing.startingTime === slot.startingTime &&
                        existing.endingTime === slot.endingTime,
                );
            });

            if (newUniqueSlots.length > 0) {
                await Doctor.findByIdAndUpdate(
                    doctor._id,
                    { $push: { timeSlots: { $each: newUniqueSlots } } },
                    { new: true },
                );
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
