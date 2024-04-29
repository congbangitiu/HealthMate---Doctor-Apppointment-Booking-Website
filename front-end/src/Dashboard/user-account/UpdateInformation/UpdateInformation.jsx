import { useEffect, useState, useNavigate } from 'react';
import classNames from 'classnames/bind';
import styles from './UpdateInformation.module.scss';

import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaRegUser } from 'react-icons/fa6';
import { CiMobile3 } from 'react-icons/ci';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import SyncLoader from 'react-spinners/SyncLoader';

import uploadImageToCloudinary from '../../../utils/uploadCloudinary';
import { BASE_URL, token } from '../../../../config';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const UpdateInformation = ({ setShowFormUpdateInfo, userData }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);
    const [passwordEmpty, setPasswordEmpty] = useState(true);
    const [confirmedPasswordEmpty, setConfirmedPasswordEmpty] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmedPassword: '',
        photo: null,
        gender: 'male',
        role: 'patient',
        bloodType: 'A+',
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
            bloodType: userData.bloodType,
        });
    }, [userData]);

    const handleShowPassword = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };
    const handleShowConfirmedPassword = () => {
        setShowConfirmedPassword((prevShowConfirmedPassword) => !prevShowConfirmedPassword);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        if (e.target.value === '' && showPassword === true) {
            setShowPassword(false);
        }
        setPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConfirmedPasswordChange = (e) => {
        if (e.target.value === '' && showConfirmedPassword === true) {
            setShowConfirmedPassword(false);
        }
        setConfirmedPasswordEmpty(e.target.value === '');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileInputChange = async (e) => {
        const file = e.target.files[0];
        const data = await uploadImageToCloudinary(file);

        setSelectedFile(data.url);
        setFormData({ ...formData, photo: data.url });
    };

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
            window.location.reload();
            toast.success(message);
        } catch (error) {
            toast.error(error.message);
            setLoading(false);
        }

        console.log(formData.bloodType);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('close-icon-wrapper')}>
                <IoMdClose className={cx('close-icon')} onClick={() => setShowFormUpdateInfo(false)} />
            </div>
            <h1>Update your information</h1>
            <form action="" onSubmit={submitHandler}>
                <div className={cx('fields')}>
                    <div className={cx('authentication')}>
                        <p>Fullname</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder="Enter your fullname"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleInputChange}
                                required
                            />
                            <FaRegUser className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>Username</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                            <FaRegUser className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>Phone No.</p>
                        <div className={cx('info')}>
                            <input
                                type="text"
                                placeholder="Enter your phone number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                            />
                            <CiMobile3 className={cx('icon')} />
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>Email</p>
                        <div className={cx('info')}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            <MdOutlineEmail className={cx('icon')} />
                        </div>
                    </div>

                    {/* <div className={cx('authentication')}>
                        <p>Password</p>
                        <div className={cx('info')}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={formData.password}
                                name="password"
                                onChange={handlePasswordChange}
                            />
                            {passwordEmpty ? (
                                <RiLockPasswordLine className={cx('icon')} />
                            ) : showPassword ? (
                                <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowPassword} />
                            ) : (
                                <FaEye className={cx('icon', 'eye')} onClick={handleShowPassword} />
                            )}
                        </div>
                    </div>
                    <div className={cx('authentication')}>
                        <p>Confirm password</p>
                        <div className={cx('info')}>
                            <input
                                type={showConfirmedPassword ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={formData.confirmedPassword}
                                name="confirmedPassword"
                                onChange={handleConfirmedPasswordChange}
                            />
                            {confirmedPasswordEmpty ? (
                                <RiLockPasswordLine className={cx('icon')} />
                            ) : showConfirmedPassword ? (
                                <FaEyeSlash className={cx('icon', 'eye')} onClick={handleShowConfirmedPassword} />
                            ) : (
                                <FaEye className={cx('icon', 'eye')} onClick={handleShowConfirmedPassword} />
                            )}
                        </div>
                    </div> */}
                </div>
                <div className={cx('selection')}>
                    <div className={cx('choose')}>
                        <h4>Blood type: </h4>
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
                    <div className={cx('choose')}>
                        <h4>You are a: </h4>
                        <select name="role" value={formData.role} onChange={handleInputChange}>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                        </select>
                    </div>
                    <div className={cx('upload-photo')}>
                        {formData.photo && <img src={formData.photo} alt="" />}
                        <input
                            type="file"
                            name="photo"
                            id="customFile"
                            accept=".jpg, .png"
                            onChange={handleFileInputChange}
                        />
                        <label htmlFor="customFile">Upload photo</label>
                    </div>
                    <div className={cx('choose')}>
                        <h4>Gender: </h4>
                        <select name="gender" value={formData.gender} onChange={handleInputChange}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <button disabled={loading && true} className={cx('submit-btn')}>
                    {loading ? <SyncLoader size={10} color="#ffffff" /> : 'Update'}
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
