import classNames from 'classnames/bind';
import styles from './Testimonial.module.scss';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css';
import 'swiper/css/bundle';
import { HiStar } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import patientAvatar from '../../assets/images/patient-avatar.png';

const cx = classNames.bind(styles);

const Testimonial = () => {
    const { t } = useTranslation();
    const comments = t('testimonial.comments', { returnObjects: true });

    return (
        <div className={cx('container')}>
            <h2>{t('testimonial.title')}</h2>
            <p>{t('testimonial.subtitle')}</p>

            <div className={cx('content')}>
                <Swiper
                    modules={[Pagination]}
                    spaceBetween={30}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    breakpoints={{
                        640: {
                            slidesPerView: 1,
                            spaceBetween: 0,
                        },
                        768: {
                            slidesPerView: 2,
                            spaceBetween: 20,
                        },
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 30,
                        },
                    }}
                >
                    {comments.map((comment, index) => (
                        <SwiperSlide key={index}>
                            <div className={cx('comment')}>
                                <div className={cx('patient')}>
                                    <img src={patientAvatar} alt={comment.name} />
                                    <div className={cx('name-rating')}>
                                        <p className={cx('name')}>{comment.name}</p>
                                        <div className={cx('rating')}>
                                            {[...Array(comment.stars)].map((_, i) => (
                                                <HiStar key={`full-${i}`} className={cx('star-icon', 'star-active')} />
                                            ))}
                                            {[...Array(5 - comment.stars)].map((_, i) => (
                                                <HiStar
                                                    key={`empty-${i}`}
                                                    className={cx('star-icon', 'star-disabled')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className={cx('text')}>{comment.text}</p>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default Testimonial;
