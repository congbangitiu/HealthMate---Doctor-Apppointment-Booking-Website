import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './FAQ.module.scss';
import Doctor6 from '../../assets/images/faq-img.png';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const FAQ = () => {
    const { t } = useTranslation();
    const [openIndexes, setOpenIndexes] = useState([]);

    const faqs = t('faqs.list', { returnObjects: true });

    const toggleAccordion = (index) => {
        const currentIndex = openIndexes.indexOf(index);
        const newOpenIndexes = [...openIndexes];
        if (currentIndex === -1) {
            newOpenIndexes.push(index);
        } else {
            newOpenIndexes.splice(currentIndex, 1);
        }
        setOpenIndexes(newOpenIndexes);
    };

    return (
        <div className={cx('container')}>
            <img src={Doctor6} alt="FAQ Visual" />
            <div className={cx('content')}>
                <h2>{t('faqs.title')}</h2>
                <div className={cx('faqs')}>
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`${cx('faq')} ${openIndexes.includes(index) ? cx('open') : cx('close')}`}
                            onClick={() => toggleAccordion(index)}
                        >
                            <div className={cx('question')}>
                                <p>{faq.question}</p>
                                {openIndexes.includes(index) ? (
                                    <AiOutlineMinus className={cx('icon')} />
                                ) : (
                                    <AiOutlinePlus className={cx('icon')} />
                                )}
                            </div>
                            {openIndexes.includes(index) && <p className={cx('answer')}>{faq.answer}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
