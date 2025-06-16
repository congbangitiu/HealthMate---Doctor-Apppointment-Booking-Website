import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Introduction.module.scss';
import Doctor1 from '../../assets/images/hero-img01.png';
import Doctor2 from '../../assets/images/hero-img02.png';
import Doctor3 from '../../assets/images/hero-img03.png';
import CountUp from 'react-countup';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Statistics = [
    {
        id: 1,
        number: 30,
        character: '+',
        underlineColor: 'var(--yellowColor)',
        discription: 'introduction.stats.experience',
    },
    {
        id: 2,
        number: 15,
        character: '+',
        underlineColor: 'var(--purpleColor)',
        discription: 'introduction.stats.location',
    },
    {
        id: 3,
        number: 100,
        character: '%',
        underlineColor: 'var(--irisBlueColor)',
        discription: 'introduction.stats.satisfaction',
    },
];

const Introduction = () => {
    const { t } = useTranslation('homepage');

    return (
        <div className={cx('container')}>
            <div className={cx('content')}>
                <h2>{t('introduction.hero.title')}</h2>
                <p>{t('introduction.hero.description')}</p>
                <Link to={'/doctors'}>
                    <button className={cx('request-appointment')}>{t('introduction.hero.button')}</button>
                </Link>
                <div className={cx('statistics')}>
                    {Statistics.map((item) => (
                        <div key={item.id} className={cx('statistic')}>
                            <div className={cx('number')}>
                                <p>
                                    <CountUp duration={5} end={item.number} />
                                </p>
                                <p>{item.character}</p>
                            </div>
                            <div className={cx('underline')} style={{ backgroundColor: item.underlineColor }}></div>
                            <p>{t(item.discription)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className={cx('doctor-images')}>
                <img src={Doctor1} alt="Doctor 1" />
                <div>
                    <img src={Doctor2} alt="Doctor 2" />
                    <img src={Doctor3} alt="Doctor 3" />
                </div>
            </div>
        </div>
    );
};

export default Introduction;
