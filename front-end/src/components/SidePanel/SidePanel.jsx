import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/convertTime';
import ConfirmBooking from '../../Dashboard/user-account/ConfirmBooking/ConfirmBooking';
import { Dialog, Slide, useMediaQuery } from '@mui/material';
import formatDate from '../../utils/formatDate';
import { BiExpandAlt, BiCollapseAlt } from 'react-icons/bi';

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
                <h4>Ticket price</h4>
                <h3>${ticketPrice}</h3>
            </div>
            <div>
                <h4>Available Time Slots:</h4>
                {expandeSidePanel ? (
                    <BiCollapseAlt className={cx('icon')} onClick={() => setExpandeSidePanel(false)} />
                ) : (
                    <BiExpandAlt className={cx('icon')} onClick={() => setExpandeSidePanel(true)} />
                )}
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
                    <p className={cx('no-slot')}>
                        Dr. {doctorName} is fully booked at the moment. We’re working to add more slots - please check
                        back later!
                    </p>
                )}
            </div>
            {role === 'patient' && timeSlots.length > 0 && (
                <div className={cx('booking-btn-wrapper')}>
                    <button
                        className={cx('booking-btn', { notSelectedSlot: !selectedSlot })}
                        onClick={handleClickOpenDialog}
                        disabled={!selectedSlot}
                    >
                        Book appointment
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
