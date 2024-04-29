import SyncLoader from 'react-spinners/SyncLoader';
import classNames from 'classnames/bind';
import styles from './Loader.module.scss';

const cx = classNames.bind(styles);

const Loader = () => {
    return (
        <div className={cx('container')}>
            <SyncLoader color="#30d5c8" />
            <h4>Wait a moment ...</h4>
        </div>
    );
};

export default Loader;
