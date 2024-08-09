import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './DoctorManagement.module.scss';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { FaStar } from 'react-icons/fa';
import roundNumber from '../../../utils/roundNumber';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import AppointmentBarChart from '../Charts/DoctorAppointmentBarChart/DoctorAppointmentBarChart';

const cx = classNames.bind(styles);

const DoctorManagement = () => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const { data: doctors, loading, error } = useFetchData(`${BASE_URL}/doctors?query=${debouncedQuery}`);
    const [doctorChart, setDoctorChart] = useState('');
    const [isActiveDoctor, setIsActiveDoctor] = useState();
    const chartRef = useRef(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 700);
        return () => {
            clearTimeout(timeout);
        };
    }, [query]);

    const handleSearch = () => {
        setQuery(query.trim());
    };

    const handleInputChange = (e) => {
        const updatedQuery = e.target.value.replace(/^\s+/, '');
        setQuery(updatedQuery);
    };

    const handleClearSearch = () => {
        setQuery('');
    };

    const handleVisualizeChart = (selectedName, activeIndex) => {
        setIsActiveDoctor(activeIndex);
        setDoctorChart(selectedName);
        chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className={cx('container')}>
            <div className={cx('upper-part')}>
                <h4>Doctor</h4>
                <div className={cx('search-wrapper')}>
                    <input
                        type="text"
                        name="search"
                        id="searchInput"
                        placeholder="Type doctor's name or specialization ..."
                        value={query}
                        onChange={handleInputChange}
                    />
                    {query ? (
                        <div className={cx('close-icon-wrapper')}>
                            <IoMdCloseCircle className={cx('close-icon')} onClick={handleClearSearch} />
                        </div>
                    ) : (
                        <div className={cx('search-icon-wrapper')} onClick={handleSearch}>
                            <FaSearch className={cx('search-icon')} />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('lower-part')}>
                    <div className={cx('doctors')}>
                        {doctors.map((doctor, index) => (
                            <div key={index} className={cx('doctor', { activeDoctor: isActiveDoctor === index })}>
                                <div>
                                    <img src={doctor.photo} alt="" />
                                    <div className={cx('rating')}>
                                        <FaStar className={cx('star')} />
                                        <span>{roundNumber(doctor.averageRating, 1)}</span>
                                    </div>
                                </div>
                                <h4>Dr. {doctor.fullname}</h4>
                                <p>{doctor.specialization}</p>
                                <div className={cx('buttons')}>
                                    <Link to={`/doctors/${doctor._id}`}>
                                        <button>Details</button>
                                    </Link>
                                    <button onClick={() => handleVisualizeChart(doctor.fullname, index)}>
                                        Analysis
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div ref={chartRef} className={cx('chart')}>
                        {doctorChart !== '' && <AppointmentBarChart doctorChart={doctorChart} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorManagement;
