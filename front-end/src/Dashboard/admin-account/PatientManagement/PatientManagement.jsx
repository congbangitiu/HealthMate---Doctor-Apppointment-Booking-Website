import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './PatientManagement.module.scss';
import AdminSearch from '../AdminSearch/AdminSearch';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { PropTypes } from 'prop-types';
import Pagination from '../../../components/Pagination/Pagination';

const cx = classNames.bind(styles);

const PatientManagement = ({ users, setDebouncedQuery, loading, error }) => {
    const [query, setQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 10;

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 600);
        return () => {
            clearTimeout(timeout);
        };
    }, [query, setDebouncedQuery]);

    const patients = users.filter((user) => user.role === 'patient');

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = patients.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, patients]);

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
                    {currentItems.map((patient, index) => (
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

            {patients.length !== 0 && (
                <Pagination
                    data={patients}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    setCurrentItems={setCurrentItems}
                />
            )}
        </div>
    );
};

PatientManagement.propTypes = {
    users: PropTypes.array.isRequired,
    setDebouncedQuery: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
};

export default PatientManagement;
