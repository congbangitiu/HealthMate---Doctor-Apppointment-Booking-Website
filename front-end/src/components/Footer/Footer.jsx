import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';
import Logo from '../../assets/images/logo.png';
import { FaYoutube, FaFacebook, FaTiktok, FaLinkedin } from 'react-icons/fa';
import { AiFillInstagram } from 'react-icons/ai';
import { useTranslation, Trans } from 'react-i18next';

const cx = classNames.bind(styles);

const Footer = () => {
    const { i18n } = useTranslation();
    const { t } = useTranslation('footer');

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
        { path: '/home', display: t('links.home') },
        { path: '/', display: t('links.about') },
        { path: '/services', display: t('links.services') },
        { path: '/', display: t('links.blog') },
    ];

    const Services = [
        { path: '/', display: t('links.findDoctor') },
        { path: '/', display: t('links.appointment') },
        { path: '/', display: t('links.location') },
        { path: '/', display: t('links.opinion') },
    ];

    const Supports = [
        { path: '/', display: t('links.donate') },
        { path: '/contact', display: t('links.contact') },
    ];

    const handleChangeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <div className={cx('container')}>
            <div className={cx('left-part')}>
                <div>
                    <img src={Logo} alt="" />
                    <div>
                        <p>
                            <Trans i18nKey="copyright" t={t} components={{ 1: <b /> }} />
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
                <select onChange={(e) => handleChangeLanguage(e.target.value)} value={i18n.language}>
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                </select>
            </div>
            <div className={cx('right-part')}>
                <div className={cx('categories-wrapper')}>
                    <h4>{t('quickLinks')}</h4>
                    <div className={cx('categories')}>
                        {QuickLinks.map((quickLink, index) => (
                            <Link key={index + 1} to={quickLink.path}>
                                <p>{quickLink.display}</p>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={cx('categories-wrapper')}>
                    <h4>{t('services')}</h4>
                    <div className={cx('categories')}>
                        {Services.map((service, index) => (
                            <Link key={index + 1} to={service.path}>
                                <p>{service.display}</p>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={cx('categories-wrapper')}>
                    <h4>{t('support')}</h4>
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
