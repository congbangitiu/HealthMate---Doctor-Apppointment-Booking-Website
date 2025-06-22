import classNames from 'classnames/bind';
import styles from './ToggleButton.module.scss';
import { PropTypes } from 'prop-types';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const ToggleButton = ({ toggle, setToggle }) => {
    const { t } = useTranslation('medicalRecords');
    return (
        <div className={cx('container')}>
            {!toggle ? <h4>{t('switch.edit')}</h4> : <h4>{t('switch.view')}</h4>}
            <label className={cx('switch')}>
                <input type="checkbox" checked={toggle} onChange={() => setToggle((prevState) => !prevState)} />
                <div className={cx('slider')} />
                <div className={cx('slider-card')}>
                    <div className={cx('slider-card-face', 'slider-card-front')} />
                    <div className={cx('slider-card-face', 'slider-card-back')} />
                </div>
            </label>
        </div>
    );
};

ToggleButton.propTypes = {
    toggle: PropTypes.bool.isRequired,
    setToggle: PropTypes.func.isRequired,
};

export default ToggleButton;
