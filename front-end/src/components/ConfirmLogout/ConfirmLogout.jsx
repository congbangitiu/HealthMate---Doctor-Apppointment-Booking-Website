import { useContext } from 'react';
import classNames from 'classnames/bind';
import styles from './ConfirmLogout.module.scss';
import { IoIosLogOut } from "react-icons/io";
import PropTypes from 'prop-types';

import { authContext } from '../../context/AuthContext';

const cx = classNames.bind(styles);

const ConfirmLogout = ({ setShowConfirmLogout }) => {
    const { dispatch } = useContext(authContext);

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        window.location.href = '/login';
    };

    return (
        <div className={cx('container')}>
            <IoIosLogOut className={cx('icon')} />
            <h1>Are you sure ?</h1>
            <div>
                <button onClick={() => setShowConfirmLogout(false)}>Cancel</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

ConfirmLogout.propTypes = {
    setShowConfirmLogout: PropTypes.func,
};

export default ConfirmLogout;
