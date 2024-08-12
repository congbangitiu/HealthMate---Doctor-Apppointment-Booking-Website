import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PatientManagement.module.scss';
import useFetchData from '../../../hooks/useFetchData';
import { BASE_URL } from '../../../../config';
import AdminSearch from '../AdminSearch/AdminSearch';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import { IoMdMale, IoMdFemale } from 'react-icons/io';

const cx = classNames.bind(styles);

const PatientManagement = () => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const { data: users, loading, error } = useFetchData(`${BASE_URL}/users?query=${debouncedQuery}`);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 700);
        return () => {
            clearTimeout(timeout);
        };
    }, [query]);

    const patients = users.filter((user) => user.role === 'patient');

    return (
        <div className={cx('container')}>
            <AdminSearch
                title="Patients"
                total={patients.length}
                placeholder="Type patient's name ..."
                query={query}
                setQuery={setQuery}
            />

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('patients')}>
                    {patients.map((patient, index) => (
                        <div key={index} className={cx('patient')}>
                            <div className={cx('left-part')}>
                                <img src={patient.photo} alt="" />
                                <div className={cx('info')}>
                                    <div
                                        className={cx({
                                            male: patient.gender === 'male',
                                            female: patient.gender === 'female',
                                        })}
                                    >
                                        <div>{patient.gender === 'male' ? <IoMdMale /> : <IoMdFemale />}</div>
                                        <p>Gender</p>
                                    </div>

                                    {patient.bloodType && (
                                        <div>
                                            <div>{patient.bloodType}</div>
                                            <p>Blood type</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={cx('right-part')}>
                                <h4>{patient.fullname}</h4>
                                <div>
                                    <p>Username</p>
                                    <div>{patient.username}</div>
                                </div>

                                {patient.dateOfBirth && (
                                    <div>
                                        <p>Date of birth</p>
                                        <div>{patient.dateOfBirth}</div>
                                    </div>
                                )}
                                <div>
                                    <p>Phone</p>
                                    <div>{patient.phone}</div>
                                </div>
                                <div>
                                    <p>Email</p>
                                    <div>{patient.email}</div>
                                </div>

                                {patient.address && (
                                    <div>
                                        <p>Address</p>
                                        <div>{patient.address}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientManagement;
