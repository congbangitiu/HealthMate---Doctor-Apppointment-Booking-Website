import SyncLoader from 'react-spinners/SyncLoader';
import classNames from 'classnames/bind';
import styles from './Loader.module.scss';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const Loader = ({ iconSize }) => {
    return (
        <div className={cx('container')}>
            <SyncLoader color="#30d5c8" size={iconSize} />
            <h4>Wait a moment ...</h4>
        </div>
    );
};

Loader.propTypes = {
    iconSize: PropTypes.number,
};

export default Loader;
