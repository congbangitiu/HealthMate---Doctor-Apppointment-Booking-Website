import { useContext } from 'react';
import classNames from 'classnames/bind';
import styles from './ConfirmLogout.module.scss';
import { IoIosLogOut } from 'react-icons/io';
import PropTypes from 'prop-types';
import { authContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ConfirmLogout = ({ setShowConfirmLogout }) => {
    const { t } = useTranslation('logout');
    const { dispatch } = useContext(authContext);

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        window.location.href = '/login';
    };

    return (
        <div className={cx('container')}>
            <IoIosLogOut className={cx('icon')} />
            <h1>{t('title')}</h1>
            <div>
                <button onClick={() => setShowConfirmLogout(false)}>{t('cancel')}</button>
                <button onClick={handleLogout}>{t('logout')}</button>
            </div>
        </div>
    );
};

ConfirmLogout.propTypes = {
    setShowConfirmLogout: PropTypes.func,
};

export default ConfirmLogout;
