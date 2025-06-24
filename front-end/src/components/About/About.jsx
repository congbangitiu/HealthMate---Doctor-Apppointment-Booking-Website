import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './About.module.scss';
import Doctor4 from '../../assets/images/about.png';
import Doctor4Card from '../../assets/images/about-card.png';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const About = () => {
    const { t } = useTranslation('homepage');

    return (
        <div className={cx('container')}>
            <div className={cx('img-wrapper')}>
                <img src={Doctor4} alt="Doctor" />
                <img src={Doctor4Card} alt="Doctor Card" />
            </div>
            <div className={cx('content')}>
                <h2>{t('about.title')}</h2>
                <p>
                    {t('about.paragraph1')}
                    <br />
                    <br />
                    {t('about.paragraph2')}
                </p>
                <Link to="/services">
                    <button className={cx('more-details')}>{t('about.button')}</button>
                </Link>
            </div>
        </div>
    );
};

export default About;
