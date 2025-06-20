import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './ProfileSetting.module.scss';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineModeEditOutline, MdFileUpload } from 'react-icons/md';
import { LiaSaveSolid } from 'react-icons/lia';
import { uploadImageToCloudinary } from '../../../utils/services/uploadCloudinary';
import { BASE_URL, token } from '../../../../config';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { TextField, Autocomplete } from '@mui/material';
import TimeSlots from '../TimeSlots/TimeSlots';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ProfileSetting = ({ doctorData, isMobile }) => {
    const { t, i18n } = useTranslation(['profileSettingDoctor', 'specialties']);
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    const [loading, setLoading] = useState(false);
    const [errorWordLimit, setErrorWordLimit] = useState('');
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [loadingSignature, setLoadingSignature] = useState(false);

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        bio: '',
        gender: '',
        specialty: '',
        subspecialty: '',
        ticketPrice: 0,
        qualifications: [{ startingDate: '', endingDate: '', degree: '', university: '' }],
        experiences: [{ startingDate: '', endingDate: '', position: '', hospital: '' }],
        timeSlots: [{ day: '', startingTime: '', endingTime: '' }],
        availableSchedules: doctorData.availableSchedules || [],
        about: '',
        photo: null,
        signature: null,
    });

    const viSpecialties = i18n.getResource('vi', 'specialties');
    const enSpecialties = i18n.getResource('en', 'specialties');

    const translateToVietnameseSpecialty = useCallback(
        (rawEnName) => {
            for (const [key, specialty] of Object.entries(enSpecialties)) {
                if (specialty.name === rawEnName) {
                    return viSpecialties?.[key]?.name || rawEnName;
                }
            }
            return rawEnName;
        },
        [enSpecialties, viSpecialties],
    );

    const translateToEnglishSpecialty = useCallback(
        (rawViName) => {
            for (const [key, specialty] of Object.entries(viSpecialties)) {
                if (specialty.name === rawViName) {
                    return enSpecialties[key]?.name || rawViName;
                }
            }
            return rawViName;
        },
        [viSpecialties, enSpecialties],
    );

    const subspecialtyOptions = useMemo(() => {
        const currentLangData = i18n.getResource(i18n.language, 'specialties');
        const englishData = i18n.getResource('en', 'specialties');

        if (!currentLangData || !englishData) return [];

        return Object.entries(currentLangData).flatMap(([specialtyKey, specialty]) =>
            (specialty.subspecialties || []).map((sub, index) => ({
                label: sub.name,
                value: `${specialtyKey}_${index}`,
                rawName: englishData?.[specialtyKey]?.subspecialties?.[index]?.name || sub.name,
                parentSpecialty: specialty.name,
                parentKey: specialtyKey,
            })),
        );
    }, [i18n.language]);

    const initialSubspecialty = subspecialtyOptions.find((item) => item.rawName === doctorData.subspecialty);

    useEffect(() => {
        setFormData({
            fullname: doctorData.fullname || '',
            email: doctorData.email || '',
            phone: doctorData.phone || '',
            bio: doctorData.bio || '',
            gender: doctorData.gender || '',
            specialty: initialSubspecialty?.parentSpecialty || doctorData.specialty || '',
            subspecialty: initialSubspecialty || null,
            ticketPrice: doctorData.ticketPrice || 0,
            qualifications: doctorData.qualifications.map((qualification) => ({
                startingDate: qualification.startingDate,
                endingDate: qualification.endingDate,
                degree: qualification.degree,
                university: qualification.university,
            })),
            experiences: doctorData.experiences.map((experience) => ({
                startingDate: experience.startingDate,
                endingDate: experience.endingDate,
                position: experience.position,
                hospital: experience.hospital,
            })),
            timeSlots: doctorData.timeSlots.map((timeSlot) => ({
                day: timeSlot.day,
                startingTime: timeSlot.startingTime,
                endingTime: timeSlot.endingTime,
            })),
            availableSchedules: doctorData.availableSchedules || [],
            about: doctorData.about || '',
            photo: doctorData.photo || '',
            signature: doctorData.signature || '',
        });
    }, [doctorData]);

    useEffect(() => {
        setFormData((prev) => {
            if (!prev.subspecialty) return prev;
            const matched = subspecialtyOptions.find((opt) => opt.rawName === prev.subspecialty.rawName);
            return matched ? { ...prev, subspecialty: matched } : prev;
        });
    }, [i18n.language, subspecialtyOptions]);

    useEffect(() => {
        setFormData((prev) => {
            if (i18n.language === 'en' && prev.specialty) {
                const translatedSpecialty = translateToEnglishSpecialty(prev.specialty);
                return {
                    ...prev,
                    specialty: translatedSpecialty,
                };
            }
            const translatedName = prev.specialty ? translateToVietnameseSpecialty(prev.specialty) : prev.specialty;
            return {
                ...prev,
                specialty: translatedName,
            };
        });
    }, [i18n.language, translateToVietnameseSpecialty, translateToEnglishSpecialty]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'bio') {
            if (value.length > 350) {
                setErrorWordLimit(t('messages.bioLimit'));
                setFormData({ ...formData, [name]: value.slice(0, 350) });
            } else {
                setErrorWordLimit('');
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleUploadAvatar = async (e) => {
        setLoadingAvatar(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, photo: data?.url });
        setLoadingAvatar(false);
    };

    const handleUploadSignature = async (e) => {
        setLoadingSignature(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, signature: data?.url });
        setLoadingSignature(false);
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const updateProfileHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/doctors/${doctorData._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    subspecialty: formData.subspecialty?.rawName,
                    specialty: formData.specialty,
                }),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message);
            }
            toast.success('Profile updated successfully');
            setLoading(false);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    // Resuable functions
    const addItem = (key, item) => {
        setFormData((preFormData) => ({ ...preFormData, [key]: [...preFormData[key], item] }));
    };

    const deleteItem = (key, index) => {
        setFormData((preFormData) => ({
            ...preFormData,
            [key]: preFormData[key].filter((_, i) => i !== index),
        }));
    };

    const handleReusableInputChange = (key, event, index) => {
        const { name, value } = event.target;
        setFormData((preFormData) => {
            const updateItems = [...preFormData[key]];
            updateItems[index][name] = value;
            return { ...preFormData, [key]: updateItems };
        });
    };

    const handleSubspecialtyChange = (selectedOption) => {
        if (!selectedOption) return;

        setFormData((prev) => ({
            ...prev,
            subspecialty: selectedOption,
            specialty: selectedOption.parentSpecialty,
        }));
    };

    // Qualification functions
    const addQualification = (e) => {
        e.preventDefault();
        addItem('qualifications', {
            startingDate: '',
            endingDate: '',
            degree: '',
            university: '',
        });
    };

    const handleQuanlificationChange = (event, index) => {
        handleReusableInputChange('qualifications', event, index);
    };

    const deleteQualification = (e, index) => {
        e.preventDefault();
        deleteItem('qualifications', index);
    };

    // Experience functions
    const addExperience = (e) => {
        e.preventDefault();
        addItem('experiences', {
            startingDate: '',
            endingDate: '',
            position: '',
            hospital: '',
        });
    };

    const handleExperienceChange = (event, index) => {
        handleReusableInputChange('experiences', event, index);
    };

    const deleteExperience = (e, index) => {
        e.preventDefault();
        deleteItem('experiences', index);
    };

    // Format date to YYYY-MM-DD to match the date picker format
    const formatDateToYYYYMMDD = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Generate days of week with actual dates
    const getDaysOfWeekWithDates = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)

        return days
            .map((day, index) => {
                const date = new Date(today);
                // If the day is in the past this week, show next week's date
                if (index < currentDay) {
                    date.setDate(date.getDate() + 7 - (currentDay - index));
                } else {
                    date.setDate(date.getDate() + (index - currentDay));
                }

                return {
                    name: day,
                    date: formatDateToYYYYMMDD(date),
                    dateObj: date,
                };
            })
            .filter((day) => day.name !== 'Sunday'); // Remove Sunday if not needed
    };

    const daysOfWeekWithDates = getDaysOfWeekWithDates();

    const handleTimeSlotsChange = useCallback(
        (slots) => {
            setFormData((prev) => ({
                ...prev,
                timeSlots: slots,
            }));
        },
        [daysOfWeekWithDates],
    );

    // Edit
    const toggleEditable = (key, index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [key]: prevFormData[key].map((item, idx) =>
                idx === index ? { ...item, isEditable: !item.isEditable } : item,
            ),
        }));
    };

    return (
        <div className={cx('container')}>
            {/* PERSONAL INFORMATION  */}
            <h3 className={cx('title')}>{t('titles.personalInfo')}</h3>
            <div className={cx('upperPart')}>
                <div className={cx('leftPart')}>
                    <div className={cx('info')}>
                        <label htmlFor="fullname">{t('fields.fullname')}</label>
                        <input
                            type="text"
                            id="fullname"
                            placeholder={t('fields.fullname')}
                            value={formData.fullname}
                            name="fullname"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="email">{t('fields.email')}</label>
                        <input
                            type="email"
                            id="email"
                            placeholder={t('fields.email')}
                            value={formData.email}
                            name="email"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className={cx('info')}>
                        <label htmlFor="phone">{t('fields.phone')}</label>
                        <input
                            type="text"
                            id="phone"
                            placeholder={t('fields.phone')}
                            value={formData.phone}
                            name="phone"
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div className={cx('rightPart')}>
                    <div className={cx('info')}>
                        <span>
                            <label htmlFor="message">{t('fields.bio')}</label>
                            {errorWordLimit && <p className={cx('error')}>{errorWordLimit}</p>}
                        </span>
                        <textarea
                            id="message"
                            cols="30"
                            rows="3"
                            placeholder={t('fields.bioPlaceholder')}
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className={cx('upload', 'avatar')}>
                        {formData.photo && <img src={formData.photo} alt="" />}
                        <input
                            type="file"
                            name="photo"
                            id="customAvatar"
                            accept=".jpg, .png, .jpeg, .webp"
                            onChange={handleUploadAvatar}
                        />
                        <label htmlFor="customAvatar">
                            {loadingAvatar ? (
                                <SyncLoader size={7} color="#ffffff" />
                            ) : isMobile ? (
                                <MdFileUpload />
                            ) : (
                                t('fields.uploadPhoto')
                            )}
                        </label>
                        <p>{t('fields.photoNote')}</p>
                    </div>
                    <div className={cx('upload', 'signature')}>
                        {formData.signature && <img src={formData.signature} alt="" />}
                        <input
                            type="file"
                            name="signature"
                            id="customSignature"
                            accept=".jpg, .png, .jpeg, .webp"
                            onChange={handleUploadSignature}
                        />
                        <label htmlFor="customSignature">
                            {loadingSignature ? (
                                <SyncLoader size={7} color="#ffffff" />
                            ) : isMobile ? (
                                <MdFileUpload />
                            ) : (
                                t('fields.uploadSignature')
                            )}
                        </label>
                        <p>{t('fields.signatureNote')}</p>
                    </div>
                </div>
            </div>
            <div className={cx('info', 'selection')}>
                <div className={cx('field')}>
                    <label htmlFor="gender">{t('fields.gender')}</label>
                    <select name="gender" id="gender" value={formData.gender} onChange={handleInputChange} required>
                        <option value="">{t('fields.genderSelect')}</option>
                        <option value="Male">{t('fields.male')}</option>
                        <option value="Female">{t('fields.female')}</option>
                        <option value="Other">{t('fields.other')}</option>
                    </select>
                </div>
                <div className={cx('field')}>
                    <label htmlFor="ticketPrice">{t('fields.ticketPrice')}</label>
                    <input
                        type="number"
                        name="ticketPrice"
                        id="ticketPrice"
                        value={formData.ticketPrice}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className={cx('field')}>
                    <label htmlFor="specialty">{t('fields.specialty')}</label>
                    <input
                        name="specialty"
                        id="specialty"
                        value={
                            i18n.language === 'vi'
                                ? translateToVietnameseSpecialty(formData.specialty)
                                : formData.specialty
                        }
                        required
                        readOnly
                    />
                </div>
                <div className={cx('field')}>
                    <label htmlFor="subspecialty">{t('fields.subspecialty')}</label>
                    <Autocomplete
                        disablePortal
                        options={subspecialtyOptions}
                        value={formData.subspecialty}
                        getOptionLabel={(option) => option.label}
                        onChange={(event, newValue) => handleSubspecialtyChange(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        padding: '5px 10px',
                                        fontSize: '16px',
                                        borderRadius: '5px',
                                        '& fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
                                        },
                                        '&:hover fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            border: '2px solid var(--darkGrayColor)',
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
                                {option.label}
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

            {/* QUALIFICATION */}
            <h3 className={cx('title', 'other')}>{t('titles.qualifications')}</h3>
            <div className={cx('details')}>
                {formData.qualifications?.map((qualification, index) => (
                    <div key={index} className={cx('credentials')}>
                        <div className={cx('credential')}>
                            <label htmlFor="startingDate">{t('qualifications.startingDate')}</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="date"
                                id="startingDate"
                                value={qualification.startingDate}
                                name="startingDate"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="endingDate">{t('qualifications.endingDate')}</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="date"
                                id="endingDate"
                                value={qualification.endingDate}
                                name="endingDate"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="degree">{t('qualifications.degree')}</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="text"
                                id="degree"
                                value={qualification.degree}
                                name="degree"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="university">{t('qualifications.university')}</label>
                            <input
                                className={cx(!qualification.isEditable && 'disabled')}
                                type="text"
                                id="university"
                                value={qualification.university}
                                name="university"
                                onChange={(e) => handleQuanlificationChange(e, index)}
                                disabled={!qualification.isEditable}
                            />
                        </div>
                        <div></div>
                        <div className={cx('modeWrapper')}>
                            <div className={cx('mode')} onClick={() => toggleEditable('qualifications', index)}>
                                {qualification.isEditable ? (
                                    <>
                                        <LiaSaveSolid className={cx('icon')} />
                                        <p className={cx('text')}>{t('actions.save')}</p>
                                    </>
                                ) : (
                                    <>
                                        <MdOutlineModeEditOutline className={cx('icon')} />
                                        <p className={cx('text')}>{t('actions.edit')}</p>
                                    </>
                                )}
                            </div>
                            <div className={cx('mode')} onClick={(e) => deleteQualification(e, index)}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>{t('actions.delete')}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <button className={cx('add')} onClick={addQualification}>
                    {t('qualifications.add')}
                </button>
            </div>

            {/* EXPERIENCES */}
            <h3 className={cx('title', 'other')}>{t('titles.experiences')}</h3>
            <div className={cx('details')}>
                {formData.experiences?.map((experience, index) => (
                    <div key={index} className={cx('credentials')}>
                        <div className={cx('credential')}>
                            <label htmlFor="startingDate">{t('experiences.startingDate')}</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="date"
                                id="startingDate"
                                value={experience.startingDate}
                                name="startingDate"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="endingDate">{t('experiences.endingDate')}</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="date"
                                id="endingDate"
                                value={experience.endingDate}
                                name="endingDate"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="position">{t('experiences.position')}</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="text"
                                id="position"
                                value={experience.position}
                                name="position"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div className={cx('credential')}>
                            <label htmlFor="hospital">{t('experiences.hospital')}</label>
                            <input
                                className={cx(!experience.isEditable && 'disabled')}
                                type="text"
                                id="hospital"
                                value={experience.hospital}
                                name="hospital"
                                onChange={(e) => handleExperienceChange(e, index)}
                                disabled={!experience.isEditable}
                            />
                        </div>
                        <div></div>
                        <div className={cx('modeWrapper')}>
                            <div className={cx('mode')} onClick={() => toggleEditable('experiences', index)}>
                                {experience.isEditable ? (
                                    <>
                                        <LiaSaveSolid className={cx('icon')} />
                                        <p className={cx('text')}>{t('actions.save')}</p>
                                    </>
                                ) : (
                                    <>
                                        <MdOutlineModeEditOutline className={cx('icon')} />
                                        <p className={cx('text')}>{t('actions.edit')}</p>
                                    </>
                                )}
                            </div>
                            <div className={cx('mode')} onClick={(e) => deleteExperience(e, index)}>
                                <FaRegTrashAlt className={cx('icon')} />
                                <p className={cx('text')}>{t('actions.delete')}</p>{' '}
                            </div>
                        </div>
                    </div>
                ))}
                <button className={cx('add')} onClick={addExperience}>
                    {t('experiences.add')}
                </button>
            </div>

            {/* TIME SLOTS */}
            <h3 className={cx('title', 'other')}>{t('titles.timeSlots')}</h3>
            <TimeSlots
                handleTimeSlotsChange={handleTimeSlotsChange}
                daysOfWeekWithDates={daysOfWeekWithDates}
                currentTimeSlots={doctorData.timeSlots}
                availableSchedules={formData.availableSchedules}
                onAvailableScheduleChange={(updated) =>
                    setFormData((prev) => ({
                        ...prev,
                        availableSchedules: updated,
                    }))
                }
            />

            {/* ABOUT */}
            <h3 className={cx('title', 'other')}>{t('titles.about')}</h3>
            <textarea
                id="message"
                cols="30"
                rows="6"
                placeholder={t('fields.aboutPlaceholder')}
                name="about"
                value={formData.about}
                onChange={handleInputChange}
            />

            <button onClick={updateProfileHandler} className={cx('submit-btn')}>
                {loading ? <SyncLoader size={10} color="#ffffff" /> : t('actions.update')}
            </button>
        </div>
    );
};

ProfileSetting.propTypes = {
    doctorData: PropTypes.object.isRequired,
    isMobile: PropTypes.bool.isRequired,
};

export default ProfileSetting;
