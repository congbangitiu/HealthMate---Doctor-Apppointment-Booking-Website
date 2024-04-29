import PropTypes from 'prop-types'; 

import classNames from 'classnames/bind';
import styles from './Error.module.scss';
import errorIcon from '../../assets/images/error-icon.png'

const cx = classNames.bind(styles);

const Error = ({ errorMessage }) => {
    return (
        <div className={cx('container')}>
            <img src={errorIcon} alt="" />
            <h4>{errorMessage} !!!</h4>
        </div>
    );
};

Error.propTypes = {
    errorMessage: PropTypes.string.isRequired 
};

export default Error;
