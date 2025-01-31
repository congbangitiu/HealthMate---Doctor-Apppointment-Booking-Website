import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './SidePanel.module.scss';
import convertTime from '../../utils/convertTime';
import ConfirmBooking from '../../Dashboard/user-account/ConfirmBooking/ConfirmBooking';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const SidePanel = ({ doctorId, ticketPrice, timeSlots: initialTimeSlots = [], doctorPhoto, doctorName, role }) => {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeSlots, setTimeSlots] = useState(initialTimeSlots);
    const [openDialog, setOpenDialog] = useState(false);

    const handleClickOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('price')}>
                <h4>Ticket price</h4>
                <h3>${ticketPrice}</h3>
            </div>
            <div className={cx('slots')}>
                <h4>Available Time Slots:</h4>
                {timeSlots?.map((timeSlot, index) => (
                    <div
                        key={index}
                        className={cx('slot', { selected: selectedSlot === timeSlot })}
                        onClick={() => setSelectedSlot(timeSlot)}
                    >
                        {role === 'patient' && (
                            <input
                                type="radio"
                                name="timeSlot"
                                value={index}
                                checked={selectedSlot === timeSlot}
                                onChange={() => setSelectedSlot(timeSlot)}
                            />
                        )}

                        <p>{timeSlot.day}</p>
                        <p>
                            {convertTime(timeSlot.startingTime)} - {convertTime(timeSlot.endingTime)}
                        </p>
                    </div>
                ))}
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
                className={cx('booking-confirmation')}
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '16px',
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
};

export default SidePanel;
