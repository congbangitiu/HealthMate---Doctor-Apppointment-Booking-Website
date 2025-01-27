import React from 'react';
import { useState, useContext } from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { BiMenu } from 'react-icons/bi';
import { IoIosClose, IoMdHome, IoIosLogOut } from 'react-icons/io';
import { FaUserDoctor } from 'react-icons/fa6';
import { MdMedicalServices, MdContactSupport } from 'react-icons/md';
import { authContext } from '../../context/AuthContext';
import ConfirmLogout from '../ConfirmLogout/ConfirmLogout';

const cx = classNames.bind(styles);

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

            {showConfirmLogout && (
                <div className={cx('form-wrapper')}>
                    <div className={cx('overlay-logout')}></div>
                    <div className={cx('logout')}>
                        <ConfirmLogout setShowConfirmLogout={setShowConfirmLogout} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
