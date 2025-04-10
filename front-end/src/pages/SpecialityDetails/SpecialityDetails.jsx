import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SpecialityDetails.module.scss';

const cx = classNames.bind(styles);

const SpecialityDetails = () => {
    const { id } = useParams();
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);
    return <div className={cx('container')}>SpecialityDetails</div>;
};

export default SpecialityDetails;
