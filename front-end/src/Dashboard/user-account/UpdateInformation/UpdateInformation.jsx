import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './UpdateInformation.module.scss';

import { MdOutlineEmail } from 'react-icons/md';
import { FaRegUser } from 'react-icons/fa6';
import { CiMobile3 } from 'react-icons/ci';
import { IoMdClose } from 'react-icons/io';
import { IoHomeOutline } from 'react-icons/io5';
import { LiaBirthdayCakeSolid } from 'react-icons/lia';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';
import { uploadImageToCloudinary } from '../../../utils/services/uploadCloudinary';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const UpdateInformation = ({ setShowFormUpdateInfo, userData }) => {
    const { t } = useTranslation('updateInfo');
    const [loading, setLoading] = useState(false);
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmedPassword: '',
        photo: null,
        dateOfBirth: '',
        address: '',
        gender: '',
        role: 'patient',
        bloodType: '',
    });

    useEffect(() => {
        setFormData({
            fullname: userData.fullname,
            username: userData.username,
            phone: userData.phone,
            email: userData.email,
            gender: userData.gender,
            role: userData.role,
            photo: userData.photo,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address,
            bloodType: userData.bloodType,
        });
    }, [userData]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileInputChange = async (e) => {
        setLoadingAvatar(true);
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setFormData({ ...formData, photo: data.url });
        setLoadingAvatar(false);
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/users/${userData._id}`, {
                method: 'put',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const { message } = await res.json();
            if (!res.ok) {
                throw new Error(message);
            }
            setLoading(false);
            setShowFormUpdateInfo(false);
            toast.success(message);
            await delay(2000);
            window.location.reload();
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('close-icon-wrapper')}>
                <IoMdClose className={cx('close-icon')} onClick={() => setShowFormUpdateInfo(false)} />
            </div>
            <h1>{t('title')}</h1>
            <form action="" onSubmit={submitHandler}>
                <div className={cx('fields')}>
                    <div className={cx('authentication')}>
                        <p>{t('fields.fullname')}</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder={t('fields.fullnamePlaceholder')}
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleInputChange}
                                required
                            />
                            <FaRegUser className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('fields.username')}</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder={t('fields.usernamePlaceholder')}
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                            <FaRegUser className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('fields.phone')}</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder={t('fields.phonePlaceholder')}
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                            <CiMobile3 className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('fields.email')}</p>
                        <div className={cx('info')}>
                            <input
                                type="email"
                                placeholder={t('fields.emailPlaceholder')}
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                            <MdOutlineEmail className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('fields.dob')}</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder={t('fields.dobPlaceholder')}
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                            />
                            <LiaBirthdayCakeSolid className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>{t('fields.address')}</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder={t('fields.addressPlaceholder')}
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                            <IoHomeOutline className={cx('icon')} />
                        </div>
                    </div>
                </div>

                <div className={cx('selection')}>
                    <div className={cx('choose')}>
                        <h4>{t('bloodType')}:</h4>
                        <select name="bloodType" value={formData.bloodType} onChange={handleInputChange}>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>
                    {/* <div className={cx('choose')}>
                        <h4>You are a: </h4>
                        <select name="role" value={formData.role} onChange={handleInputChange}>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div> */}
                    <div className={cx('upload-photo')}>
                        {formData.photo && <img src={formData.photo} alt="" />}
                        <input
                            type="file"
                            name="photo"
                            id="customFile"
                            accept=".jpg, .png"
                            onChange={handleFileInputChange}
                        />
                        <label htmlFor="customFile">
                            {loadingAvatar ? <SyncLoader size={7} color="#ffffff" /> : t('uploadPhoto')}
                        </label>
                    </div>
                    <div className={cx('choose')}>
                        <h4>{t('gender')}:</h4>
                        <select name="gender" value={formData.gender} onChange={handleInputChange}>
                            <option value="male">{t('genderOptions.male')}</option>
                            <option value="female">{t('genderOptions.female')}</option>
                            <option value="other">{t('genderOptions.other')}</option>
                        </select>
                    </div>
                </div>

                <button disabled={loading && true} className={cx('submit-btn')}>
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : t('updateBtn')}
                </button>
            </form>
        </div>
    );
};

UpdateInformation.propTypes = {
    setShowFormUpdateInfo: PropTypes.func.isRequired,
    userData: PropTypes.object.isRequired,
};

export default UpdateInformation;
