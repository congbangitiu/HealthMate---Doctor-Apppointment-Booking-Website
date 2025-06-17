import { useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Contact.module.scss';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Contact = () => {
    const { t } = useTranslation('contact');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <h2>{t('title')}</h2>
            <p>{t('description')}</p>
            <form action="">
                <div className={cx('fields')}>
                    <div className={cx('info')}>
                        <label htmlFor="fullname">{t('fullname')}</label>
                        <input type="text" id="fullname" placeholder={t('fullnamePlaceholder')} />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="email">{t('email')}</label>
                        <input type="text" id="email" placeholder={t('emailPlaceholder')} />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="phone">{t('phone')}</label>
                        <input type="text" id="phone" placeholder={t('phonePlaceholder')} />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="subject">{t('subject')}</label>
                        <input type="text" id="subject" placeholder={t('subjectPlaceholder')} />
                    </div>
                </div>
                <div className={cx('message')}>
                    <label htmlFor="message">{t('message')}</label>
                    <textarea id="message" cols="30" rows="6" placeholder={t('messagePlaceholder')} />
                </div>
                <div className={cx('submit-btn-wrapper')}>
                    <button className={cx('submit-btn')}>{t('submit')}</button>
                </div>
            </form>
        </div>
    );
};

export default Contact;
