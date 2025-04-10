import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Specialties.module.scss';
import SwiperImg1 from '../../assets/images/SwiperImg1.jpg';
import SwiperImg2 from '../../assets/images/SwiperImg2.jpg';
import SwiperImg3 from '../../assets/images/SwiperImg3.jpg';
import SwiperImg4 from '../../assets/images/SwiperImg4.jpg';
import SwiperImg5 from '../../assets/images/SwiperImg5.jpg';
import SwiperImg6 from '../../assets/images/SwiperImg6.jpg';
import SwiperImg7 from '../../assets/images/SwiperImg7.jpg';
import SwiperImg8 from '../../assets/images/SwiperImg8.jpg';
import SwiperImg9 from '../../assets/images/SwiperImg9.jpg';
import SwiperImg10 from '../../assets/images/SwiperImg10.jpg';
import { Carousel } from 'antd';
import specialties from '../../assets/data/mock-data/specialties';

const cx = classNames.bind(styles);

const Specialties = () => {
    const imageCarousel = [
        SwiperImg1,
        SwiperImg2,
        SwiperImg3,
        SwiperImg4,
        SwiperImg5,
        SwiperImg6,
        SwiperImg7,
        SwiperImg8,
        SwiperImg9,
        SwiperImg10,
    ];

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    return (
        <div className={cx('container')}>
            <Carousel autoplay={{ dotDuration: true }} autoplaySpeed={3000} draggable className={cx('carousel')}>
                {imageCarousel.map((img, index) => (
                    <img key={index} src={img} alt="" />
                ))}
            </Carousel>
            <div className={cx('specialties')}>
                {specialties.map((specialty) => (
                    <Link className={cx('specialty')} key={specialty.id} to={`/specialties/${specialty.id}`}>
                        <div>
                            <img src={specialty.image} alt="" />
                        </div>
                        <div>
                            <h4>{specialty.name}</h4>
                            <h4>({specialty.abbreviation})</h4>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Specialties;
