import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorCreationForm.module.scss';
import SyncLoader from 'react-spinners/SyncLoader';
import { TextField, Autocomplete } from '@mui/material';
import specialties from '../../assets/data/mock-data/specialties';
import { BASE_URL, token } from '../../../config';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const DoctorCreationForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        gender: '',
        email: '',
        password: '',
        specialty: '',
        subspecialty: '',
        role: 'doctor',
        isApproved: 'approved',
    });

    const subspecialtyOptions = specialties.reduce((acc, specialty) => {
        if (specialty.subspecialties) {
            return [...acc, ...specialty.subspecialties.map((subspecialty) => subspecialty.name)];
        }
        return acc;
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'username' && { password: value }),
        }));
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true);

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        try {
            const res = await fetch(`${BASE_URL}/admins/add-doctor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }
            setLoading(false);
            toast.success(result.message);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            setLoading(false);
            toast.error(error.message);
        }
    };

    return (
        <div className={cx('container')}>
            <h1>Doctor Creation Form</h1>
            <form onSubmit={handleSubmitForm}>
                <div className={cx('fields')}>
                    <div className={cx('field')}>
                        <p>Full name</p>
                        <input
                            placeholder="Enter doctor's full name"
                            name="fullname"
                            required
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={cx('field-row')}>
                        <div className={cx('username')}>
                            <p>Username</p>
                            <input
                                placeholder="Enter doctor's username"
                                name="username"
                                required
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={cx('gender')}>
                            <p>Gender</p>
                            <select
                                name="gender"
                                id="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className={cx('field')}>
                        <p>Email</p>
                        <input placeholder="Enter doctor's email" name="email" required onChange={handleInputChange} />
                    </div>
                    <div className={cx('field')}>
                        <p>Password</p>
                        <input
                            type="password"
                            placeholder="Password will be the same as username initially"
                            name="password"
                            required
                            value={formData.username}
                            readOnly
                            className={cx('no-click')}
                        />
                    </div>
                    <div className={cx('field-row')}>
                        <div className={cx('specialty')}>
                            <p>Specialty</p>

                            <input
                                name="specialty"
                                id="specialty"
                                required
                                readOnly
                                value={formData.specialty}
                                className={cx('no-click')}
                            />
                        </div>
                        <div className={cx('subspecialty')}>
                            <p>Subspecialty</p>
                            <Autocomplete
                                disablePortal
                                options={subspecialtyOptions}
                                value={formData.subspecialty}
                                onChange={(event, value) => {
                                    const matchedSpecialty = specialties.find((spec) =>
                                        spec.subspecialties?.some((sub) => sub.name === value),
                                    );
                                    setFormData((prev) => ({
                                        ...prev,
                                        subspecialty: value || '',
                                        specialty: matchedSpecialty?.name || '',
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                padding: '4px 10px',
                                                fontSize: '16px',
                                                borderRadius: '5px',
                                                '& fieldset': {
                                                    border: '1px solid var(--darkGrayColor)',
                                                },
                                                '&:hover fieldset': {
                                                    border: '1px solid var(--darkGrayColor)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    border: '1px solid var(--darkGrayColor)',
                                                },
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: '10px',
                                                fontSize: '16px',
                                            },
                                        }}
                                    />
                                )}
                                renderOption={(props, option, { selected }) => (
                                    <li
                                        {...props}
                                        style={{
                                            fontWeight: selected ? '500' : 'normal',
                                            backgroundColor: selected ? 'var(--lightGreenColor)' : 'inherit',
                                        }}
                                    >
                                        {option}
                                    </li>
                                )}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            '& .MuiAutocomplete-option': {
                                                fontSize: '16px',
                                                '&:hover': {
                                                    backgroundColor: 'var(--lightGrayColor) !important',
                                                },
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
                <button disabled={loading} className={cx('submit-btn')}>
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : 'Add new doctor'}
                </button>
            </form>
        </div>
    );
};

export default DoctorCreationForm;
