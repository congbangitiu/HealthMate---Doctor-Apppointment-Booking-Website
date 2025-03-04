import React from 'react';
import { useState, useContext, useEffect } from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { BiMenu } from 'react-icons/bi';
import { IoIosClose, IoMdHome, IoIosLogOut, IoIosNotifications } from 'react-icons/io';
import { FaUserDoctor } from 'react-icons/fa6';
import { MdMedicalServices, MdContactSupport } from 'react-icons/md';
import Popover from '@mui/material/Popover';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import { authContext } from '../../context/AuthContext';
import ConfirmLogout from '../ConfirmLogout/ConfirmLogout';
import Notifications from '../Notifications/Notifications';
import { BASE_URL } from '../../../config';
import useFetchData from '../../hooks/useFetchData';
import notificationSound from '../../assets/sounds/notificationSound.wav';

import { io } from 'socket.io-client';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});
// Create a single global socket instance
const socket = io(import.meta.env.VITE_REACT_PUBLIC_SOCKET_URL);

const navLinks = [
    {
        path: '/home',
        icon: IoMdHome,
        content: 'Home',
    },
    {
        path: '/doctors',
        icon: FaUserDoctor,
        content: 'Doctors',
    },
    {
        path: '/services',
        icon: MdMedicalServices,
        content: 'Services',
    },
    {
        path: '/contact',
        icon: MdContactSupport,
        content: 'Contact',
    },
];

const Header = () => {
    const location = useLocation();
    const { user, role, token } = useContext(authContext);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { data: appointmentData } = useFetchData(
        role === 'doctor' ? `${BASE_URL}/doctors/appointments/my-appointments` : null,
    );
    const { data: prescriptionData } = useFetchData(
        role === 'patient' ? `${BASE_URL}/users/appointments/my-prescriptions` : null,
    );
    const [unreadAppointments, setUnreadAppointments] = useState(0);
    const [unreadPrescriptions, setUnreadPrescriptions] = useState(0);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const isActive = (path) => {
        return location.pathname === path || (location.pathname === '/' && path === '/home');
    };

    const isProfileOrAppointment = () => {
        const paths = [
            '/doctors/profile/me',
            '/users/profile/me',
            '/admins/management',
            '/doctors/appointments/my-appointments',
            '/users/appointments/my-appointments',
        ];
        return paths.some((path) => location.pathname.startsWith(path));
    };

    const handlePath = () => {
        if (role === 'admin') window.location.href = '/admins/management';
        else if (role === 'patient') window.location.href = '/users/profile/me';
        else if (role === 'doctor') window.location.href = '/doctors/profile/me';
    };

    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                if (role === 'doctor') {
                    const response = await fetch(`${BASE_URL}/bookings/${user._id}/unread-bookings`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const data = await response.json();
                    if (response.ok) {
                        setUnreadAppointments(data.unreadCount);
                    }
                } else if (role === 'patient') {
                    const response = await fetch(`${BASE_URL}/prescriptions/${user._id}/unread-prescriptions`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const data = await response.json();
                    if (response.ok) {
                        setUnreadPrescriptions(data.unreadCount);
                    }
                }
            } catch (error) {
                console.error('Error fetching unread notifications:', error);
            }
        };

        if (user) {
            fetchUnreadCounts();
            socket.emit(role === 'doctor' ? 'doctor-join-room' : 'user-join-room', { userId: user._id });
        }

        socket.on('booking-notification', () => {
            if (role === 'doctor') {
                setUnreadAppointments((prev) => prev + 1);
            }
        });

        socket.on('prescription-notification', () => {
            if (role === 'patient') {
                setUnreadPrescriptions((prev) => prev + 1);
            }
        });

        return () => {
            socket.off('booking-notification');
            socket.off('prescription-notification');
        };
    }, [token, user, role]);

    const markNotificationsAsRead = async () => {
        try {
            let response;
            if (role === 'doctor') {
                setUnreadAppointments(0);
                response = await fetch(`${BASE_URL}/bookings/${user._id}/mark-bookings-read`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
            } else if (role === 'patient') {
                setUnreadPrescriptions(0);
                response = await fetch(`${BASE_URL}/prescriptions/${user._id}/mark-prescriptions-read`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
            }

            if (!response.ok) throw new Error('Failed to mark notifications as read.');
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleOpenNotifications = async (event) => {
        setAnchorEl(event.currentTarget);
        setIsNotiOpen(true);
        setIsShaking(false);
        await markNotificationsAsRead();
    };

    const handleCloseNotifications = async () => {
        setAnchorEl(null);
        setIsNotiOpen(false);
        await markNotificationsAsRead();
    };

    // Play notification sound when a new booking arrives
    const playNotificationSound = () => {
        const audio = new Audio(notificationSound);
        audio.play().catch((error) => console.error('Error playing sound:', error));
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
        }, 2000);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    // Update notifications from API when component mounts
    useEffect(() => {
        let formattedData = [];

        if (role === 'doctor' && appointmentData) {
            formattedData = appointmentData.map((item) => {
                // Check if statusHistory exists and has data
                const latestStatusObj =
                    Array.isArray(item.statusHistory) && item.statusHistory.length > 0
                        ? item.statusHistory[item.statusHistory.length - 1]
                        : null;

                // Determine the appropriate `createdAt`
                const createdAtTimestamp =
                    latestStatusObj && latestStatusObj.status === 'cancelled'
                        ? latestStatusObj.timestamp
                        : item.createdAt;

                return {
                    id: item._id,
                    appointmentId: item._id,
                    user: item.user,
                    timeSlot: item.timeSlot,
                    createdAt: createdAtTimestamp,
                    type: 'booking',
                    status: latestStatusObj ? latestStatusObj.status : item.status, // Get the last status from statusHistory if available
                };
            });
        } else if (role === 'patient' && prescriptionData) {
            // Flatten the actionHistory array to display each action as a separate notification
            formattedData = prescriptionData.flatMap((item) => {
                if (item.actionHistory && Array.isArray(item.actionHistory)) {
                    return item.actionHistory.map((action, index) => ({
                        id: `${item._id}-${index}`,
                        appointmentId: item.appointment._id,
                        doctor: item.appointment.doctor,
                        timeSlot: item.appointment.timeSlot,
                        createdAt: action.timestamp,
                        action: action.action,
                        type: 'prescription',
                    }));
                }

                // If there is no actionHistory, there is only 1 default message
                return {
                    id: item._id,
                    appointmentId: item.appointment._id,
                    doctor: item.appointment.doctor,
                    timeSlot: item.appointment.timeSlot,
                    action: item.action,
                    createdAt: item.createdAt,
                    type: 'prescription',
                };
            });
        }

        setNotifications(
            formattedData
                .sort((a, b) => {
                    if (a.action === 'create' && b.action === 'update') return -1;
                    return new Date(b.createdAt) - new Date(a.createdAt); // Sort by time if same action type
                })
                .slice(0, 6),
        );
    }, [role, appointmentData, prescriptionData]);

    useEffect(() => {
        if (!user) return;

        const updateNotifications = (newNotification) => {
            setNotifications((prevNotifications) => {
                if (newNotification.type === 'prescription' && newNotification.actionHistory) {
                    const lastAction = newNotification.actionHistory[newNotification.actionHistory.length - 1];

                    const latestNotification = {
                        id: `${newNotification.id}-${newNotification.actionHistory.length - 1}`,
                        appointmentId: newNotification.appointmentId,
                        doctor: newNotification.doctor,
                        timeSlot: newNotification.timeSlot,
                        status: newNotification.status,
                        createdAt: lastAction.timestamp,
                        action: lastAction.action,
                        type: 'prescription',
                    };

                    console.log('latestNotification.action: ', latestNotification.action);
                    

                    return [latestNotification, ...prevNotifications]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 6);
                }

                return [newNotification, ...prevNotifications]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 6);
            });

            if (newNotification.type === 'booking' && role === 'doctor') {
                setUnreadAppointments((prev) => prev + 1);
            } else if (newNotification.type === 'prescription' && role === 'patient') {
                setUnreadPrescriptions((prev) => prev + 1);
            }

            triggerShake();
            playNotificationSound();
        };

        if (role === 'doctor') {
            socket.emit('doctor-join-room', { doctorId: user._id });

            // Listen for announcements when patients make appointments
            socket.off('booking-notification'); // Remove old event listener before adding new one
            socket.on('booking-notification', (appointment) => {
                const newNotification = {
                    id: appointment.bookingId,
                    appointmentId: appointment.bookingId,
                    user: appointment.user,
                    timeSlot: appointment.timeSlot,
                    createdAt: appointment.createdAt,
                    type: 'booking',
                    status: appointment.status,
                };

                updateNotifications(newNotification);
            });

            // Listen for announcements when doctors cancel appointments
            socket.off('cancelled-notification'); // Remove old event listener before adding new one
            socket.on('cancelled-notification', (appointment) => {
                const newNotification = {
                    id: `cancelled-${appointment.appointmentId}`,
                    appointmentId: appointment.appointmentId,
                    user: appointment.user,
                    timeSlot: appointment.timeSlot,
                    createdAt: appointment.createdAt,
                    type: 'booking',
                    status: appointment.status,
                };

                updateNotifications(newNotification);
            });
        }

        if (role === 'patient') {
            socket.emit('user-join-room', { userId: user._id });

            socket.off('prescription-notification'); // Remove old event listener before adding new one
            socket.on('prescription-notification', (prescription) => {
                const newNotification = {
                    id: `${prescription.appointmentId}-${prescription.actionHistory.length - 1}`,
                    appointmentId: prescription.appointmentId,
                    doctor: prescription.doctor,
                    timeSlot: prescription.timeSlot,
                    message: prescription.message,
                    createdAt: prescription.createdAt,
                    type: 'prescription',
                    actionHistory: prescription.actionHistory,
                };

                updateNotifications(newNotification);
            });
        }

        return () => {
            socket.off('booking-notification');
            socket.off('prescription-notification');
            socket.off('cancelled-notification');
        };
    }, [user, role]);

    return (
        <div className={cx('container')}>
            {/* Logo */}
            <img className={cx('logo')} src={logo} alt="Logo" />

            {/* Menu */}
            <div className={cx('navigation')}>
                <input className={cx('nav-input')} type="checkbox" id="nav-mobile-input" hidden />
                <label htmlFor="nav-mobile-input" className={cx('overlay')}></label>
                <ul className={cx('menu')}>
                    <div className={cx('close-icon-wrapper')}>
                        <label htmlFor="nav-mobile-input">
                            <IoIosClose className={cx('close-icon')} />
                        </label>
                    </div>
                    {navLinks.map((link, index) => (
                        <li key={index}>
                            <NavLink to={link.path} className={cx('link', { active: isActive(link.path) })}>
                                {React.createElement(link.icon, { className: cx('link-icon') })}
                                {link.content}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Nav right */}
            <div className={cx('authentication')}>
                {token && user ? (
                    <>
                        <div>
                            <div
                                className={cx('inner', user && 'isLogin', { profileActive: isProfileOrAppointment() })}
                                onClick={handlePath}
                            >
                                <div className={cx('info')}>
                                    <img className={cx('avatar')} src={user?.photo} alt="" />
                                    <div className={cx('name')}>
                                        <h4>{user?.fullname}</h4>
                                        <p>{user?.username}</p>
                                    </div>
                                </div>
                            </div>
                            <button className={cx('logout-btn')} onClick={() => setShowConfirmLogout(true)}>
                                <IoIosLogOut />
                            </button>
                        </div>

                        <div
                            className={cx('noti', { open })}
                            aria-owns={open ? 'mouse-over-popover' : undefined}
                            aria-haspopup="true"
                            onClick={handleOpenNotifications}
                        >
                            <IoIosNotifications className={cx('icon', { shake: isShaking })} />
                            {role === 'doctor' && unreadAppointments > 0 && !isNotiOpen && (
                                <div>{unreadAppointments}</div>
                            )}
                            {role === 'patient' && unreadPrescriptions > 0 && !isNotiOpen && (
                                <div>{unreadPrescriptions}</div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            <button className={cx('login')}>Login</button>
                        </Link>
                        <Link to="/register">
                            <button className={cx('register')}>Register</button>
                        </Link>
                    </>
                )}

                <label htmlFor="nav-mobile-input">
                    <BiMenu className={cx('menu-icon')} />
                </label>
            </div>

            <Dialog
                open={showConfirmLogout}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setShowConfirmLogout(false)}
                aria-describedby="alert-dialog-slide-description"
            >
                <div className={cx('logout')}>
                    <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
                </div>
            </Dialog>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseNotifications}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: '10px',
                        marginTop: '20px',
                        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.15)',
                    },
                }}
            >
                <Notifications
                    notifications={notifications}
                    role={role}
                    handleCloseNotifications={handleCloseNotifications}
                />
            </Popover>
        </div>
    );
};

export default Header;
