import React from 'react';
import { useState, useContext } from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import { BiMenu } from 'react-icons/bi';
import { IoIosClose, IoMdHome } from 'react-icons/io';
import { FaUserDoctor } from 'react-icons/fa6';
import { MdMedicalServices, MdContactSupport } from 'react-icons/md';
import { authContext } from '../../context/AuthContext';

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
    const [activeLink, setActiveLink] = useState(null);
    const location = useLocation();
    const { user, role, token } = useContext(authContext);

    const handleNavLinkClick = (index) => {
        setActiveLink(index);
    };

    const isActive = (path) => {
        return location.pathname === path || (location.pathname === '/' && path === '/home');
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
                            <NavLink
                                to={link.path}
                                className={cx('link', { active: isActive(link.path) })}
                                onClick={() => handleNavLinkClick(index)}
                            >
                                {React.createElement(link.icon, { className: cx('link-icon') })}
                                {link.content}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Nav right */}
            <div className={cx('authentication', user && 'isLogin')}>
                {token && user ? (
                    // <Link to={`/${role === 'doctor' ? 'doctors' : 'users'}/profile/me`} className={cx('info')}>
                    //     <img className={cx('avatar')} src={user?.photo} alt="" />
                    //     <div className={cx('name')}>
                    //         <h4>{user?.fullname}</h4>
                    //         <p>{user?.username}</p>
                    //     </div>
                    // </Link>
                    <div
                        onClick={() =>
                            (window.location.href = `/${role === 'doctor' ? 'doctors' : 'users'}/profile/me`)
                        }
                        className={cx('info')}
                    >
                        <img className={cx('avatar')} src={user?.photo} alt="" />
                        <div className={cx('name')}>
                            <h4>{user?.fullname}</h4>
                            <p>{user?.username}</p>
                        </div>
                    </div>
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
        </div>
    );
};

export default Header;
