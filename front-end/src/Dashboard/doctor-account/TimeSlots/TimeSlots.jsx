import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import styles from './TimeSlots.module.scss';
import PropTypes from 'prop-types';
import { MenuItem, Select, Box, useTheme } from '@mui/material';
import useResponsive from '../../../hooks/useResponsive';
import formatDateForDisplay from '../../../utils/date-time/formatDateForDisplay';
import convertTime from '../../../utils/date-time/convertTime';
import getDateForDay from '../../../utils/date-time/getDateForDay';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const timePeriods = {
    Morning: { start: '08:00', end: '11:30' },
    Afternoon: { start: '13:00', end: '16:00' },
    Evening: { start: '18:00', end: '21:00' },
};

const availableTime = Object.keys(timePeriods);

const generateTimeSlots = (period, date) => {
    const { start, end } = timePeriods[period];
    const slots = [];
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        let nextHour = currentHour;
        let nextMinute = currentMinute + 30;

        if (nextMinute >= 60) {
            nextHour += 1;
            nextMinute -= 60;
        }

        slots.push({
            date,
            start: startTime,
            end: `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`,
            period,
        });

        currentHour = nextHour;
        currentMinute = nextMinute;
    }

    return slots;
};

const TimeSlots = ({
    handleTimeSlotsChange,
    daysOfWeekWithDates,
    currentTimeSlots,
    availableSchedules,
    onAvailableScheduleChange,
}) => {
    const { t: tProfileDoctor } = useTranslation('profileSettingDoctor');
    const { t: tSchedule } = useTranslation('schedule');
    const { isMobile } = useResponsive();
    const theme = useTheme();

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 6);

    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedTimes, setSelectedTimes] = useState({});

    useEffect(() => {
        if (availableSchedules?.length > 0 && selectedDays.length === 0) {
            const days = [];
            const times = {};
            availableSchedules.forEach(({ day, shifts }) => {
                const match = daysOfWeekWithDates.find((d) => d.name === day);
                if (match) {
                    days.push(match.name);
                    times[match.name] = shifts;
                }
            });
            setSelectedDays(days);
            setSelectedTimes(times);
        }
    }, [availableSchedules, daysOfWeekWithDates, selectedDays.length]);

    useEffect(() => {
        const updatedSchedules = selectedDays.map((dayName) => ({
            day: dayName,
            shifts: selectedTimes[dayName] || [],
        }));
        onAvailableScheduleChange(updatedSchedules);
    }, [selectedDays, selectedTimes, onAvailableScheduleChange]);

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

    const allTimeSlots = useMemo(() => {
        const allSlots = [];

        selectedDays.forEach((day) => {
            const date = getDateForDay(day);

            selectedTimes[day]?.forEach((period) => {
                const slots = generateTimeSlots(period, date);
                allSlots.push(...slots);
            });
        });

        return allSlots.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [selectedDays, selectedTimes]);

    useEffect(() => {
        if (allTimeSlots.length > 0) {
            const formattedSlots = allTimeSlots.map((slot) => ({
                day: slot.date,
                startingTime: slot.start,
                endingTime: slot.end,
            }));
            handleTimeSlotsChange(formattedSlots);
        }
    }, [allTimeSlots, handleTimeSlotsChange]);

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
                <h3>{tProfileDoctor('timeSlots.availableDays')}</h3>
                <Select
                    multiple
                    value={selectedDays}
                    onChange={handleDayChange}
                    MenuProps={MenuProps}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '5px', width: '100%' }}>
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
                                        {`${tSchedule(`weekdays.${value}`)} (${formatDateForDisplay(dayInfo?.date)})`}
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
                                '&:hover': { backgroundColor: 'var(--lightGreenColor) !important' },
                            }}
                        >
                            {`${tSchedule(`weekdays.${day.name}`)} (${formatDateForDisplay(day.date)})`}
                        </MenuItem>
                    ))}
                </Select>
            </div>

            {selectedDays.length > 0 && (
                <div className={cx('middle-part')}>
                    <span>
                        <h3>{tProfileDoctor('timeSlots.availableShifts')}</h3>
                        <p>{tProfileDoctor('timeSlots.shiftNote')}</p>
                    </span>
                    {selectedDays.map((day) => {
                        const dayInfo = daysOfWeekWithDates.find((d) => d.name === day);
                        return (
                            <div key={day} className={cx('day-section')}>
                                <h4>{`${tSchedule(`weekdays.${day}`)} (${formatDateForDisplay(dayInfo?.date)})`}</h4>
                                <Select
                                    multiple
                                    value={selectedTimes[day] || []}
                                    onChange={handleTimeChange(day)}
                                    MenuProps={MenuProps}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '5px', width: '100%' }}>
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
                                                    {tSchedule(`shifts.${value}`)}
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
                                                '&:hover': { backgroundColor: 'var(--lightGreenColor) !important' },
                                            }}
                                        >
                                            {tSchedule(`shifts.${option}`)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </div>
                        );
                    })}
                </div>
            )}

            {allTimeSlots.length > 0 && (
                <div className={cx('lower-part')}>
                    <h3
                        dangerouslySetInnerHTML={{
                            __html: tProfileDoctor('timeSlots.generatedSlotsTitle', {
                                start: formatDateForDisplay(today),
                                end: formatDateForDisplay(endDate),
                            }),
                        }}
                    />
                    <table className={cx('slots-table')}>
                        <thead>
                            <tr>
                                <th>{tProfileDoctor('timeSlots.table.date')}</th>
                                <th>{tProfileDoctor('timeSlots.table.time')}</th>
                                <th>{tProfileDoctor('timeSlots.table.period')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupSlotsByDate().map(([date, slots], groupIndex) => (
                                <React.Fragment key={date}>
                                    {slots.map((slot, slotIndex) => (
                                        <tr key={`${groupIndex}-${slotIndex}`}>
                                            {slotIndex === 0 && (
                                                <td
                                                    rowSpan={slots.length}
                                                    className={cx(groupIndex % 2 === 0 ? 'odd-date' : 'even-date')}
                                                >
                                                    {formatDateForDisplay(date)}
                                                </td>
                                            )}
                                            <td>{`${convertTime(slot.start)} - ${convertTime(slot.end)}`}</td>
                                            <td>{tSchedule(`shifts.${slot.period}`)}</td>
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
