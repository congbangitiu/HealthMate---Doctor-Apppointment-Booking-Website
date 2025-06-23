import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorCreationForm.module.scss';
import SyncLoader from 'react-spinners/SyncLoader';
import { TextField, Autocomplete } from '@mui/material';
import specialties from '../../assets/data/mock-data/specialties';
import { BASE_URL, token } from '../../../config';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import translateSpecialtyName from '../../utils/translation/translateSpecialtyName';
import translateSubspecialtyName from '../../utils/translation/translateSubspecialtyName';

const cx = classNames.bind(styles);

const DoctorCreationForm = () => {
    const { t, i18n } = useTranslation(['doctorManagement']);

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
            <h1>{t('doctorCreationForm.title')}</h1>
            <form onSubmit={handleSubmitForm}>
                <div className={cx('fields')}>
                    <div className={cx('field')}>
                        <p>{t('doctorCreationForm.fields.fullname')}</p>
                        <input
                            placeholder={t('doctorCreationForm.fields.fullnamePlaceholder')}
                            name="fullname"
                            required
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={cx('field-row')}>
                        <div className={cx('username')}>
                            <p>{t('doctorCreationForm.fields.username')}</p>
                            <input
                                placeholder={t('doctorCreationForm.fields.usernamePlaceholder')}
                                name="username"
                                required
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className={cx('gender')}>
                            <p>{t('doctorCreationForm.fields.gender')}</p>
                            <select
                                name="gender"
                                id="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">{t('doctorCreationForm.fields.genderSelect')}</option>
                                <option value="male">{t('doctorCreationForm.fields.genderMale')}</option>
                                <option value="female">{t('doctorCreationForm.fields.genderFemale')}</option>
                                <option value="other">{t('doctorCreationForm.fields.genderOther')}</option>
                            </select>
                        </div>
                    </div>
                    <div className={cx('field')}>
                        <p>{t('doctorCreationForm.fields.email')}</p>
                        <input
                            placeholder={t('doctorCreationForm.fields.emailPlaceholder')}
                            name="email"
                            required
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={cx('field')}>
                        <p>{t('doctorCreationForm.fields.password')}</p>
                        <input
                            type="password"
                            placeholder={t('doctorCreationForm.fields.passwordNote')}
                            name="password"
                            required
                            value={formData.username}
                            readOnly
                            className={cx('no-click')}
                        />
                    </div>
                    <div className={cx('field-row')}>
                        <div className={cx('specialty')}>
                            <p>{t('doctorCreationForm.fields.specialty')}</p>
                            <input
                                name="specialty"
                                id="specialty"
                                placeholder={t('doctorCreationForm.fields.specialtyNote')}
                                required
                                readOnly
                                value={translateSpecialtyName(formData.specialty, i18n)}
                                className={cx('no-click')}
                            />
                        </div>
                        <div className={cx('subspecialty')}>
                            <p>{t('doctorCreationForm.fields.subspecialty')}</p>
                            <Autocomplete
                                disablePortal
                                options={subspecialtyOptions}
                                value={translateSubspecialtyName(formData.subspecialty, i18n)}
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
                                        {translateSubspecialtyName(option, i18n)}
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
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : t('doctorCreationForm.button.submit')}
                </button>
            </form>
        </div>
    );
};

export default DoctorCreationForm;
