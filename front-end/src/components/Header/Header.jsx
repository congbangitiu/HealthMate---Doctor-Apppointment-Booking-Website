import React from 'react';
import { useEffect, useRef, useState } from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import userImg from '../../assets/images/avatar-icon.png';
import { BiMenu } from 'react-icons/bi';
import { IoIosClose, IoMdHome } from 'react-icons/io';
import { FaUserDoctor } from 'react-icons/fa6';
import { MdMedicalServices, MdContactSupport } from 'react-icons/md';

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
            <div className={cx('authentication')}>
                <Link to="/">
                    <img className={cx('avatar', 'hidden')} src={userImg} alt="" />
                </Link>
                <Link to="/login">
                    <button className={cx('login')}>Login</button>
                </Link>
                <Link to="/register">
                    <button className={cx('register')}>Register</button>
                </Link>

                <label htmlFor="nav-mobile-input">
                    <BiMenu className={cx('menu-icon')} />
                </label>
            </div>
        </div>
    );
};

export default Header;
