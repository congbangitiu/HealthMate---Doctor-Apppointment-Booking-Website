import React from 'react';
import { useState, useContext, useEffect, useRef } from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { BiMenu } from 'react-icons/bi';
import { IoMdHome, IoIosLogOut, IoIosNotifications } from 'react-icons/io';
import { GoDotFill } from 'react-icons/go';
import { RxHamburgerMenu } from 'react-icons/rx';
import { FaUserDoctor } from 'react-icons/fa6';
import { MdMedicalServices, MdContactSupport } from 'react-icons/md';
import { FaStethoscope } from 'react-icons/fa';
import { Popover, Dialog, Drawer, Slide } from '@mui/material';
import useResponsive from '../../hooks/useResponsive';
import { authContext } from '../../context/AuthContext';
import ConfirmLogout from '../ConfirmLogout/ConfirmLogout';
import Notifications from '../Notifications/Notifications';
import { BASE_URL } from '../../../config';
import useFetchData from '../../hooks/useFetchData';
import notificationSound from '../../assets/sounds/notificationSound.wav';
import DefaultMaleDoctorAvatar from '../../assets/images/default-male-doctor.png';
import DefaultFemaleDoctorAvatar from '../../assets/images/default-female-doctor.png';
import { useTranslation } from 'react-i18next';
import socket from '../../utils/services/socket';
import subscribeNotifications from '../../utils/services/subscribeNotifications';

const cx = classNames.bind(styles);
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Header = () => {
    const { t } = useTranslation('navbar');
    const location = useLocation();
    const { isMobile } = useResponsive();
    const { user, role, token } = useContext(authContext);
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { data: appointmentData } = useFetchData(
        `${BASE_URL}/${role === 'doctor' ? 'doctors' : 'users'}/appointments/my-appointments`,
    );
    const { data: prescriptionData } = useFetchData(
        role === 'patient' ? `${BASE_URL}/users/appointments/my-prescriptions` : null,
    );
    const [unreadAppointments, setUnreadAppointments] = useState(0);
    const [unreadPrescriptions, setUnreadPrescriptions] = useState(0);
    const [scheduleNotifications, setScheduleNotifications] = useState([]);
    const [unreadScheduleChanges, setUnreadScheduleChanges] = useState(0);
    const scheduleRevision = useRef(0);
    const seenScheduleNotifications = useRef(new Set());
    const visibleNotifications = [...new Map([...notifications, ...scheduleNotifications].map((item) => [item.id, item])).values()]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isShowMenuMobile, setIsShowMenuMobile] = useState(false);

    useEffect(() => {
        setScheduleNotifications([]);
        setUnreadScheduleChanges(0);
        seenScheduleNotifications.current.clear();
        scheduleRevision.current += 1;
        if (role !== 'patient' || !user?._id || !token) return;
        let active = true;
        let controller;
        const loadChanges = async () => {
            controller?.abort();
            const requestController = new AbortController();
            controller = requestController;
            const revision = scheduleRevision.current;
            try {
                const response = await fetch(`${BASE_URL}/bookings/calendar/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }, signal: requestController.signal,
                });
                if (!response.ok) return;
                const body = await response.json();
                if (!active || requestController.signal.aborted) return;
                if (revision !== scheduleRevision.current) {
                    loadChanges();
                    return;
                }
                for (const item of body.data || []) seenScheduleNotifications.current.add(item.id);
                setScheduleNotifications((current) => [...new Map([...(body.data || []), ...current].map((item) => [item.id, item])).values()]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6));
                setUnreadScheduleChanges(body.unreadCount || 0);
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Error fetching schedule notifications:', error);
            }
        };
        loadChanges();
        socket.on('connect', loadChanges);
        return () => {
            active = false;
            controller?.abort();
            socket.off('connect', loadChanges);
        };
    }, [role, user?._id, token]);

    const navLinks = [
        {
            path: '/home',
            icon: IoMdHome,
            content: t('home'),
        },
        {
            path: '/specialties',
            icon: FaStethoscope,
            content: t('specialties'),
        },
        {
            path: '/doctors',
            icon: FaUserDoctor,
            content: t('doctors'),
        },
        {
            path: '/services',
            icon: MdMedicalServices,
            content: t('services'),
        },
        {
            path: '/contact',
            icon: MdContactSupport,
            content: t('contact'),
        },
    ];

    const isActive = (path) => {
        if (path === '/home') {
            return location.pathname === '/' || location.pathname === '/home';
        }

        // Special case for doctors: avoid marking "Doctors" as active when on the profile page
        if (
            role === 'doctor' &&
            path === '/doctors' &&
            (location.pathname === '/doctors/profile/me' ||
                location.pathname.startsWith('/doctors/appointments/my-appointments'))
        ) {
            return false;
        }

        // Ensure exact match or specific subpaths
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
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
        if (role === 'admin') window.location.href = '/admins/management/dashboard';
        else if (role === 'patient') window.location.href = '/users/profile/me';
        else if (role === 'doctor') window.location.href = '/doctors/profile/me';
    };

    const defaultDoctorAvatar =
        role === 'doctor' && user.gender === 'male' ? DefaultMaleDoctorAvatar : DefaultFemaleDoctorAvatar;

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
        }
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
                const unreadAtOpen = unreadScheduleChanges;
                const latestChange = scheduleNotifications[0]?.createdAt;
                setUnreadPrescriptions(0);
                response = await fetch(`${BASE_URL}/prescriptions/${user._id}/mark-prescriptions-read`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                if (latestChange) {
                    const scheduleResponse = await fetch(`${BASE_URL}/bookings/calendar/notifications/read`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ before: latestChange }),
                    });
                    if (!scheduleResponse.ok) throw new Error('Failed to mark schedule notifications as read.');
                    scheduleRevision.current += 1;
                    setUnreadScheduleChanges((count) => Math.max(0, count - unreadAtOpen));
                }
            }

            if (!response.ok) throw new Error('Failed to mark notifications as read.');
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

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

    // Update notifications from API when component mounts
    useEffect(() => {
        let formattedData = [];

        if (role === 'doctor' && appointmentData) {
            formattedData = appointmentData
                // Filter out follow-up appointments from the start
                .filter((item) => !item.isReExamination)
                .map((item) => {
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
                        status: latestStatusObj ? latestStatusObj.status : item.status,
                        isReExamination: false,
                    };
                });
        } else if (role === 'patient' && prescriptionData) {
            // Flatten the actionHistory array to display each action as a separate notification
            const prescriptionNotifications = prescriptionData.flatMap((item) => {
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

            formattedData = [...formattedData, ...prescriptionNotifications];

            if (appointmentData) {
                const reExamNotifications = appointmentData
                    .filter((item) => item.isReExamination)
                    .map((item) => ({
                        id: item._id,
                        appointmentId: item._id,
                        doctor: item.doctor,
                        timeSlot: item.timeSlot,
                        createdAt: item.createdAt,
                        type: 're-examination',
                        status: item.status,
                        isReExamination: true,
                    }));
                formattedData = [...formattedData, ...reExamNotifications];
            }
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

        const handlers = {};

        if (role === 'doctor') {
            // Listen for announcements when patients make appointments
            handlers['booking-notification'] = (appointment) => {
                if (!appointment.isReExamination) {
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
                }
            };

            // Listen for announcements when doctors cancel appointments
            handlers['cancelled-notification'] = (appointment) => {
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
            };
        }

        if (role === 'patient') {
            handlers['reschedule-notification'] = (notification) => {
                if (seenScheduleNotifications.current.has(notification.id)) return;
                seenScheduleNotifications.current.add(notification.id);
                scheduleRevision.current += 1;
                setScheduleNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6));
                setUnreadScheduleChanges((count) => count + 1);
                triggerShake();
                playNotificationSound();
            };
            handlers['prescription-notification'] = (prescription) => {
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
            };

            handlers['re-examination-notification'] = (booking) => {
                const newNotification = {
                    id: booking.bookingId,
                    appointmentId: booking.bookingId,
                    doctor: booking.doctor,
                    timeSlot: booking.timeSlot,
                    createdAt: booking.createdAt,
                    type: 're-examination',
                    isReExamination: true,
                };

                updateNotifications(newNotification);
                setUnreadPrescriptions((prev) => prev + 1);
            };
        }

        return subscribeNotifications(socket, role, user._id, handlers);
    }, [user, role]);

    return (
        <div className={cx('container')}>
            <div>
                <RxHamburgerMenu className={cx('hamburger-icon')} onClick={() => setIsShowMenuMobile(true)} />
                <img className={cx('logo')} src={logo} alt="Logo" />
            </div>

            {/* Menu */}
            <div className={cx('navigation')}>
                <ul className={cx('menu')}>
                    {navLinks.map((link, index) => (
                        <li key={index}>
                            <NavLink to={link.path} className={cx('link', { active: isActive(link.path) })}>
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
                                    <img className={cx('avatar')} src={user?.photo || defaultDoctorAvatar} alt="" />
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
                            role="button"
                            tabIndex={0}
                            aria-label={t('notification:title')}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleOpenNotifications(event);
                                }
                            }}
                            onClick={handleOpenNotifications}
                        >
                            <IoIosNotifications className={cx('icon', { shake: isShaking })} />
                            {role === 'doctor' && unreadAppointments > 0 && !isNotiOpen && (
                                <div>{unreadAppointments}</div>
                            )}
                            {role === 'patient' && unreadPrescriptions + unreadScheduleChanges > 0 && !isNotiOpen && (
                                <div>{unreadPrescriptions + unreadScheduleChanges}</div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            <button className={cx('login')}>{t('login')}</button>
                        </Link>
                        <Link to="/register">
                            <button className={cx('register')}>{t('register')}</button>
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

            {!isMobile ? (
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
                            width: '420px',
                        },
                    }}
                >
                    <Notifications
                        notifications={visibleNotifications}
                        role={role}
                        handleCloseNotifications={handleCloseNotifications}
                    />
                </Popover>
            ) : (
                <Drawer
                    id={id}
                    open={open}
                    anchor="right"
                    onClose={handleCloseNotifications}
                    sx={{
                        '& .MuiPaper-root': {
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        },
                    }}
                >
                    <Notifications
                        notifications={visibleNotifications}
                        role={role}
                        handleCloseNotifications={handleCloseNotifications}
                    />
                </Drawer>
            )}

            <Drawer
                open={isShowMenuMobile}
                onClose={() => setIsShowMenuMobile(false)}
                sx={{
                    '& .MuiPaper-root': {
                        width: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    },
                }}
            >
                <div className={cx('menu-mobile')}>
                    {navLinks.map((link, index) => (
                        <li key={index} onClick={() => setIsShowMenuMobile(false)}>
                            <NavLink to={link.path} className={cx('link', { active: isActive(link.path) })}>
                                {React.createElement(link.icon, { className: cx('link-icon') })}
                                {link.content}
                            </NavLink>
                        </li>
                    ))}
                    <button className={cx('logout-mobile')} onClick={() => setShowConfirmLogout(true)}>
                        <IoIosLogOut className={cx('icon')} /> {t('logout')}
                    </button>
                </div>
                <div className={cx('policy')}>
                    <p>{t('privacy')}</p>
                    <GoDotFill className={cx('icon')} />
                    <p>{t('terms')}</p>
                </div>
            </Drawer>
        </div>
    );
};

export default Header;
