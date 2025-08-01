import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/date-time/convertTime';
import ConfirmBooking from '../../Dashboard/user-account/ConfirmBooking/ConfirmBooking';
import { Dialog, Slide, useMediaQuery } from '@mui/material';
import formatDate from '../../utils/date-time/formatDate';
import { BiExpandAlt, BiCollapseAlt } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SidePanel = ({
    doctorId,
    ticketPrice,
    timeSlots: initialTimeSlots = [],
    doctorPhoto,
    doctorName,
    role,
    expandeSidePanel,
    setExpandeSidePanel,
}) => {
    const { t } = useTranslation('doctorDetails');
    const isMobile = useMediaQuery('(max-width:768px)');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
    const [openDialog, setOpenDialog] = useState(false);

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
                    (expandeSidePanel ? (
                        <BiCollapseAlt className={cx('icon')} onClick={() => setExpandeSidePanel(false)} />
                    ) : (
                        <BiExpandAlt className={cx('icon')} onClick={() => setExpandeSidePanel(true)} />
                    ))}
            </div>
            <div className={cx(expandeSidePanel ? 'slots-expanded' : 'slots-collapsed')}>
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
                                <p>{formatDate(timeSlot.day)}</p>
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
    expandeSidePanel: PropTypes.bool.isRequired,
    setExpandeSidePanel: PropTypes.func.isRequired,
};

export default SidePanel;
