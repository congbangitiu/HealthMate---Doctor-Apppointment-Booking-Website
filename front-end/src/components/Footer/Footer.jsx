import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';
import Logo from '../../assets/images/logo.png';
import { FaYoutube, FaFacebook, FaTiktok, FaLinkedin } from 'react-icons/fa';
import { AiFillInstagram } from 'react-icons/ai';

const cx = classNames.bind(styles);

const SocialMedias = [
    {
        id: 1,
        icon: FaYoutube,
        link: '',
    },
    {
        id: 2,
        icon: FaFacebook,
        link: '',
    },
    {
        id: 3,
        icon: FaTiktok,
        link: '',
    },
    {
        id: 4,
        icon: FaLinkedin,
        link: '',
    },
    {
        id: 5,
        icon: AiFillInstagram,
        link: '',
    },
];

const QuickLinks = [
    {
        path: '/home',
        display: 'Home',
    },
    {
        path: '/',
        display: 'About us',
    },
    {
        path: '/services',
        display: 'Services',
    },
    {
        path: '/',
        display: 'Blog',
    },
];

const Services = [
    {
        path: '/',
        display: 'Find a doctor',
    },
    {
        path: '/',
        display: 'Request an Appointment',
    },
    {
        path: '/',
        display: 'Find a Location',
    },
    {
        path: '/',
        display: 'Get a Opinion',
    },
];

const Supports = [
    {
        path: '/',
        display: 'Donate',
    },
    {
        path: '/contact',
        display: 'Contact Us',
    },
];

const Footer = () => {
    return (
        <div className={cx('container')}>
            <div className={cx('left-part')}>
                <img src={Logo} alt="" />
                <div>
                    <p>
                        Copyright ©2024 developed by <b>@CongBang</b> all right reserved
                    </p>
    
                    <div className={cx('social-medias')}>
                        {SocialMedias.map((socialMedia) => {
                            const Icon = socialMedia.icon;
                            return (
                                <a key={socialMedia.id} href={socialMedia.link}>
                                    <div className={cx('social-icon-wrapper')}>
                                        <Icon className={cx('social-icon')} div />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className={cx('right-part')}>
                <div className={cx('categories-wrapper')}>
                    <h4>Quick links</h4>
                    <div className={cx('categories')}>
                        {QuickLinks.map((quickLink, index) => (
                            <Link key={index + 1} to={quickLink.path}>
                                <p>{quickLink.display}</p>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={cx('categories-wrapper')}>
                    <h4>Services</h4>
                    <div className={cx('categories')}>
                        {Services.map((service, index) => (
                            <Link key={index + 1} to={service.path}>
                                <p>{service.display}</p>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={cx('categories-wrapper')}>
                    <h4>Support</h4>
                    <div className={cx('categories')}>
                        {Supports.map((support, index) => (
                            <Link key={index + 1} to={support.path}>
                                <p>{support.display}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
