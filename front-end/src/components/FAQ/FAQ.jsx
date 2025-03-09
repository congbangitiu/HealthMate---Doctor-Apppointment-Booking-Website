import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './FAQ.module.scss';
import FAQs from '../../assets/data/mock-data/faqs';
import Doctor6 from '../../assets/images/faq-img.png';
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';


const cx = classNames.bind(styles);

const FAQ = () => {
    const [openIndexes, setOpenIndexes] = useState([]);

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
            <img src={Doctor6} alt="" />
            <div className={cx('content')}>
                <h2>Most questions by our beloved patients</h2>
                <div className={cx('faqs')}>
                    {FAQs.map((FAQ, index) => (
                        <div
                            key={FAQ.id}
                            className={`${cx('faq')} ${openIndexes.includes(index) ? cx('open') : cx('close')}`}
                        >
                            <div className={cx('question')}>
                                <p>{FAQ.question}</p>
                                {openIndexes.includes(index) ? (
                                    <AiOutlineMinus className={cx('icon')} onClick={() => toggleAccordion(index)} />
                                ) : (
                                    <AiOutlinePlus className={cx('icon')} onClick={() => toggleAccordion(index)} />
                                )}
                            </div>
                            {openIndexes.includes(index) && <p className={cx('answer')}>{FAQ.answer}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
