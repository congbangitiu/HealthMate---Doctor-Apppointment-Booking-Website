import React from 'react';
import classNames from 'classnames/bind';
import styles from './Testimonial.module.scss';
import '../../GlobalStyle.css';

import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css';
import 'swiper/css/bundle';
import { HiStar } from 'react-icons/hi';
import Comments from '../../assets/data/mock-data/comments';

const cx = classNames.bind(styles);

const Testimonial = () => {
    return (
        <div className={cx('container')}>
            <h2>What our patient say</h2>
            <p>World-class care for everyone. Our health System offers unmatched, expert health care.</p>
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
                    {Comments.map((comment) => (
                        <SwiperSlide key={comment.id}>
                            <div className={cx('comment')}>
                                <div className={cx('patient')}>
                                    <img src={comment.image} alt="" />
                                    <div className={cx('name-rating')}>
                                        <p className={cx('name')}>{comment.name}</p>
                                        <div className={cx('rating')}>
                                            {[...Array(comment.stars)].map((index) => (
                                                <HiStar key={index} className={cx('star-icon', 'star-active')} />
                                            ))}
                                            {[...Array(5 - comment.stars)].map((index) => (
                                                <HiStar key={index} className={cx('star-icon', 'star-disabled')} />
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
