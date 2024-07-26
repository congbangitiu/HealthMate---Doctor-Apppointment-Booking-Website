import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorList.module.scss';

import Search from '../../../components/Search/Search';
import DoctorCard from '../../../components/DoctorCard/DoctorCard';

import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';

const cx = classNames.bind(styles);

const DoctorList = () => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const { data: doctors, loading, error } = useFetchData(`${BASE_URL}/doctors?query=${debouncedQuery}`);

    const handleSearch = () => {
        setQuery(query.trim());
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 700);
        return () => {
            clearTimeout(timeout);
        };
    }, [query]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    console.log(doctors);

    return (
        <div className={cx('container')}>
            <Search query={query} setQuery={setQuery} handleSearch={handleSearch} />

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('doctors-wrapper')}>
                    <h2>Our great doctors</h2>
                    <p className={cx('description')}>
                        World-class care for everyone. Our health System offers unmatched, expert health care.
                    </p>
                    <div className={cx('doctors')}>
                        {doctors.map((doctor) => (
                            <DoctorCard key={doctor._id} doctor={doctor} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorList;
