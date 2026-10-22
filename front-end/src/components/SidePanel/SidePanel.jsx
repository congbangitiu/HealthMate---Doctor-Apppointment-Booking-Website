import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/date-time/convertTime';
import ConfirmBooking from '../../Dashboard/user-account/ConfirmBooking/ConfirmBooking';
import { Dialog, Slide } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';
import formatDateForDisplay from '../../utils/date-time/formatDateForDisplay';
import { BiExpandAlt, BiCollapseAlt } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);
const emptySlots = [];
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SidePanel = ({
    doctorId,
    ticketPrice,
    timeSlots: initialTimeSlots = emptySlots,
    doctorPhoto,
    doctorName,
    role,
    expandedSidePanel,
    setExpandedSidePanel,
    selectedSlot: controlledSelectedSlot,
    setSelectedSlot: setControlledSelectedSlot,
}) => {
    const { t } = useTranslation('doctorDetails');
    const { isMobile } = useResponsive();
    const [internalSelectedSlot, setInternalSelectedSlot] = useState(null);
    const selectedSlot = controlledSelectedSlot === undefined ? internalSelectedSlot : controlledSelectedSlot;
    const setSelectedSlot = setControlledSelectedSlot || setInternalSelectedSlot;
    const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        setTimeSlots(initialTimeSlots);
    }, [initialTimeSlots]);

    useEffect(() => {
        if (!selectedSlot) return;
        const currentSlot = timeSlots.find((slot) =>
            slot.day === selectedSlot.day && slot.startingTime === selectedSlot.startingTime &&
            slot.endingTime === selectedSlot.endingTime);
        if (currentSlot !== selectedSlot) setSelectedSlot(currentSlot || null);
        if (!currentSlot) setOpenDialog(false);
    }, [timeSlots, selectedSlot, setSelectedSlot]);

    const handleClickOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSelectedSlot = (timeSlots) => {
        if (role === 'patient') {
            setSelectedSlot(timeSlots);
        }
    };

    // Filter slots to hide past starting times
    const filteredTimeSlots = timeSlots.filter((slot) => {
        const slotDateTime = new Date(`${slot.day}T${slot.startingTime}`);
        const now = new Date();
        return slotDateTime >= now;
    });

    return (
        <div className={cx('container')}>
            <div className={cx('price')}>
                <h4>{t('sidePanel.ticketPrice')}</h4>
                <h3>
                    <span className={cx('price-number')}>${ticketPrice}</span>
                    <span className={cx('price-unit')}>{t('sidePanel.sessionUnit')}</span>
                </h3>
            </div>
            <div>
                <h4>{t('sidePanel.availableSlots')}</h4>
                {timeSlots.length > 0 &&
                    (expandedSidePanel ? (
                        <BiCollapseAlt className={cx('icon')} onClick={() => setExpandedSidePanel(false)} />
                    ) : (
                        <BiExpandAlt className={cx('icon')} onClick={() => setExpandedSidePanel(true)} />
                    ))}
            </div>
            <div className={cx(expandedSidePanel ? 'slots-expanded' : 'slots-collapsed')}>
                {filteredTimeSlots.length > 0 ? (
                    filteredTimeSlots?.map((timeSlot, index) => (
                        <div
                            key={index}
                            className={cx('slot', { selected: selectedSlot === timeSlot })}
                            onClick={() => handleSelectedSlot(timeSlot)}
                        >
                            {role === 'patient' && (
                                <input
                                    type="radio"
                                    name="timeSlot"
                                    value={index}
                                    checked={selectedSlot === timeSlot}
                                    onChange={() => handleSelectedSlot(timeSlot)}
                                />
                            )}

                            <div>
                                <p>{formatDateForDisplay(timeSlot.day)}</p>
                                <p>
                                    {convertTime(timeSlot.startingTime)} - {convertTime(timeSlot.endingTime)}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className={cx('no-slot')}>{t('sidePanel.fullyBooked', { doctorName })}</p>
                )}
            </div>
            {role === 'patient' && timeSlots.length > 0 && (
                <div className={cx('booking-btn-wrapper')}>
                    <button
                        className={cx('booking-btn', { notSelectedSlot: !selectedSlot })}
                        onClick={handleClickOpenDialog}
                        disabled={!selectedSlot}
                    >
                        {t('sidePanel.bookButton')}
                    </button>
                </div>
            )}

            <Dialog
                open={openDialog}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleCloseDialog}
                aria-describedby="alert-dialog-slide-description"
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '16px',
                        width: !isMobile ? 'max-content' : '90%',
                    },
                }}
            >
                <ConfirmBooking
                    doctorId={doctorId}
                    doctorPhoto={doctorPhoto}
                    doctorName={doctorName}
                    selectedSlot={selectedSlot}
                    ticketPrice={ticketPrice}
                    setTimeSlots={setTimeSlots}
                />
            </Dialog>
        </div>
    );
};

SidePanel.propTypes = {
    doctorId: PropTypes.string.isRequired,
    ticketPrice: PropTypes.number.isRequired,
    timeSlots: PropTypes.array.isRequired,
    doctorPhoto: PropTypes.string.isRequired,
    doctorName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    expandedSidePanel: PropTypes.bool.isRequired,
    setExpandedSidePanel: PropTypes.func.isRequired,
    selectedSlot: PropTypes.object,
    setSelectedSlot: PropTypes.func,
};

export default SidePanel;
