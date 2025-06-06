import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './TimeSlots.module.scss';
import PropTypes from 'prop-types';
import { MenuItem, Select, Box, useMediaQuery, useTheme } from '@mui/material';
import formatDate from '../../../utils/formatDate';
import convertTime from '../../../utils/convertTime';

const cx = classNames.bind(styles);

const TimeSlots = ({
    handleTimeSlotsChange,
    daysOfWeekWithDates,
    currentTimeSlots,
    availableSchedules,
    onAvailableScheduleChange,
}) => {
    const isMobile = useMediaQuery('(max-width:768px)');
    const theme = useTheme();

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 6);

    // Time period definitions
    const timePeriods = {
        Morning: { start: '08:00', end: '11:30' },
        Afternoon: { start: '13:00', end: '16:00' },
        Evening: { start: '18:00', end: '21:00' },
    };

    const availableTime = Object.keys(timePeriods);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedTimes, setSelectedTimes] = useState({});

    useEffect(() => {
        if (availableSchedules?.length > 0 && selectedDays.length === 0) {
            const days = [];
            const times = {};
            availableSchedules.forEach(({ day, shifts }) => {
                const match = daysOfWeekWithDates.find((d) => d.date === day);
                if (match) {
                    days.push(match.name);
                    times[match.name] = shifts;
                }
            });
            setSelectedDays(days);
            setSelectedTimes(times);
        }
    }, [availableSchedules]);

    useEffect(() => {
        const updatedSchedules = selectedDays.map((dayName) => {
            const date = daysOfWeekWithDates.find((d) => d.name === dayName)?.date;
            return {
                day: date,
                shifts: selectedTimes[dayName] || [],
            };
        });
        onAvailableScheduleChange(updatedSchedules);
    }, [selectedDays, selectedTimes]);

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: isMobile ? '100%' : '250px',
            },
        },
    };

    const handleDayChange = (event) => {
        // Only run when initialTimeSlots changes and no date has been selected
        const newSelectedDays =
            typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;

        const newSelectedTimes = { ...selectedTimes };

        // Arranging selected days in order of the week
        const sortedSelectedDays = [...newSelectedDays].sort((a, b) => {
            const dateA = daysOfWeekWithDates.find((d) => d.name === a)?.date;
            const dateB = daysOfWeekWithDates.find((d) => d.name === b)?.date;
            return new Date(dateA) - new Date(dateB);
        });

        sortedSelectedDays.forEach((day) => {
            if (!newSelectedTimes[day]) {
                newSelectedTimes[day] = [];
            }
        });

        Object.keys(newSelectedTimes).forEach((day) => {
            if (!sortedSelectedDays.includes(day)) {
                delete newSelectedTimes[day];
            }
        });

        setSelectedDays(sortedSelectedDays);
        setSelectedTimes(newSelectedTimes);
    };

    const handleTimeChange = (day) => (event) => {
        const {
            target: { value },
        } = event;
        setSelectedTimes((prev) => ({
            ...prev,
            [day]: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    const getStyles = (option, selectedOptions, theme) => {
        return {
            fontWeight: selectedOptions?.includes(option)
                ? theme.typography.fontWeightMedium
                : theme.typography.fontWeightRegular,
            backgroundColor: selectedOptions?.includes(option) ? 'var(--primaryColor)' : 'transparent',
        };
    };

    // Generate 30-minute time slots for a given time period
    const generateTimeSlots = (period, date) => {
        const { start, end } = timePeriods[period];
        const slots = [];

        // Parse start and end times
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            // Format start time
            const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            // Calculate end time
            let nextHour = currentHour;
            let nextMinute = currentMinute + 30;

            if (nextMinute >= 60) {
                nextHour += 1;
                nextMinute -= 60;
            }

            const endTime = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

            // Add to slots
            slots.push({
                date: date,
                start: startTime,
                end: endTime,
                period: period,
            });

            // Move to next slot
            currentHour = nextHour;
            currentMinute = nextMinute;
        }

        return slots;
    };

    // Generate all selected time slots for display
    const generateAllTimeSlots = () => {
        const allSlots = [];

        selectedDays.forEach((day) => {
            const dayInfo = daysOfWeekWithDates.find((d) => d.name === day);
            if (!dayInfo) return;

            selectedTimes[day]?.forEach((period) => {
                const slots = generateTimeSlots(period, dayInfo.date);
                allSlots.push(...slots);
            });
        });

        return allSlots.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const allTimeSlots = generateAllTimeSlots();

    useEffect(() => {
        if (allTimeSlots.length > 0) {
            const formattedSlots = allTimeSlots.map((slot) => ({
                day: daysOfWeekWithDates.find((d) => d.date === slot.date)?.name || '',
                startingTime: slot.start,
                endingTime: slot.end,
            }));
            handleTimeSlotsChange(formattedSlots);
        }
    }, [allTimeSlots]);

    // Group time slots by date for display in table
    const groupSlotsByDate = () => {
        const grouped = {};

        allTimeSlots.forEach((slot) => {
            if (!grouped[slot.date]) {
                grouped[slot.date] = [];
            }
            grouped[slot.date].push(slot);
        });

        return Object.entries(grouped);
    };

    // Check if the given slot exists in the currentTimeSlots from database
    const isSlotBooked = (slot) => {
        return !currentTimeSlots.some((currentSlot) => {
            return (
                currentSlot.day === slot.date &&
                currentSlot.startingTime === slot.start &&
                currentSlot.endingTime === slot.end
            );
        });
    };

    return (
        <div className={cx('container')}>
            <div className={cx('upper-part')}>
                <h3>Available Days</h3>
                <Select
                    multiple
                    value={selectedDays}
                    onChange={handleDayChange}
                    MenuProps={MenuProps}
                    renderValue={(selected) => (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: '5px',
                                width: '100%',
                            }}
                        >
                            {selected.map((value) => {
                                const dayInfo = daysOfWeekWithDates.find((d) => d.name === value);
                                return (
                                    <Box
                                        key={value}
                                        sx={{
                                            backgroundColor: 'var(--lightGreenColor)',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '18px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                        }}
                                    >
                                        {`${value} (${formatDate(dayInfo?.date)})`}
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                    sx={{
                        width: '100%',
                        '& .MuiSelect-select': {
                            padding: '12px',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: '2px solid var(--darkGrayColor)',
                            borderRadius: '5px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--darkGrayColor)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'var(--darkGrayColor)',
                        },
                    }}
                >
                    {daysOfWeekWithDates.map((day) => (
                        <MenuItem
                            key={day.name}
                            value={day.name}
                            style={getStyles(day.name, selectedDays, theme)}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'var(--lightGreenColor) !important',
                                },
                            }}
                        >
                            {`${day.name} (${formatDate(day.date)})`}
                        </MenuItem>
                    ))}
                </Select>
            </div>

            {selectedDays.length > 0 && (
                <div className={cx('middle-part')}>
                    <span>
                        <h3>Available Shifts</h3>
                        <p>(Morning: 8:00-11:30 | Afternoon: 13:00-16:00 | Evening: 18:00-21:00)</p>
                    </span>
                    {selectedDays.map((day) => {
                        const dayInfo = daysOfWeekWithDates.find((d) => d.name === day);
                        return (
                            <div key={day} className={cx('day-section')}>
                                <h4>{`${day} (${formatDate(dayInfo?.date)})`}</h4>
                                <Select
                                    multiple
                                    value={selectedTimes[day] || []}
                                    onChange={handleTimeChange(day)}
                                    MenuProps={MenuProps}
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                flexWrap: 'wrap',
                                                gap: '5px',
                                                width: '100%',
                                            }}
                                        >
                                            {selected.map((value) => (
                                                <Box
                                                    key={value}
                                                    sx={{
                                                        backgroundColor: 'var(--lightGreenColor)',
                                                        borderRadius: '4px',
                                                        padding: '2px 6px',
                                                        fontSize: '18px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    {value}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    sx={{
                                        width: '100%',
                                        mt: 1,
                                        '& .MuiSelect-select': {
                                            padding: '12px',
                                            fontSize: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            boxSizing: 'border-box',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            border: '2px solid var(--darkGrayColor)',
                                            borderRadius: '5px',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'var(--darkGrayColor)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'var(--darkGrayColor)',
                                        },
                                    }}
                                >
                                    {availableTime.map((option) => (
                                        <MenuItem
                                            key={option}
                                            value={option}
                                            style={getStyles(option, selectedTimes[day] || [], theme)}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'var(--lightGreenColor) !important',
                                                },
                                            }}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </div>
                        );
                    })}
                </div>
            )}

            {currentTimeSlots.length > 0 && (
                <div className={cx('lower-part')}>
                    <h3>
                        Generated Time Slots from <b>{formatDate(today)}</b> to <b>{formatDate(endDate)}</b>
                    </h3>
                    <table className={cx('slots-table')}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time Slots</th>
                                <th>Period</th>
                                {/* <th>Status</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {groupSlotsByDate().map(([date, slots], groupIndex) => (
                                <React.Fragment key={date}>
                                    {slots.map((slot, slotIndex) => (
                                        <tr key={`${groupIndex}-${slotIndex}`}>
                                            {slotIndex === 0 ? (
                                                <td
                                                    rowSpan={slots.length}
                                                    className={cx(groupIndex % 2 === 0 ? 'odd-date' : 'even-date')}
                                                >
                                                    {formatDate(date)}
                                                </td>
                                            ) : null}
                                            <td>{`${convertTime(slot.start)} - ${convertTime(slot.end)}`}</td>
                                            <td>{slot.period}</td>

                                            {/* <td className={cx({ booked: isSlotBooked(slot) })}>{`${convertTime(
                                                slot.start,
                                            )} - ${convertTime(slot.end)}`}</td>
                                            <td className={cx({ booked: isSlotBooked(slot) })}>{slot.period}</td>
                                            <td className={cx({ booked: isSlotBooked(slot) })}>
                                                {isSlotBooked(slot) ? 'Booked' : 'Available'}
                                            </td> */}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

TimeSlots.propTypes = {
    handleTimeSlotsChange: PropTypes.func.isRequired,
    daysOfWeekWithDates: PropTypes.array.isRequired,
    currentTimeSlots: PropTypes.array.isRequired,
    availableSchedules: PropTypes.array.isRequired,
    onAvailableScheduleChange: PropTypes.func.isRequired,
};

export default TimeSlots;
