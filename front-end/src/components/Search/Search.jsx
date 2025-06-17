import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Search.module.scss';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Search = ({ query, setQuery, handleSearch }) => {
    const { t } = useTranslation('search');
    const handleInputChange = (e) => {
        const updatedQuery = e.target.value.replace(/^\s+/, '');
        setQuery(updatedQuery);
    };

    const handleClearSearch = () => {
        setQuery('');
    };

    return (
        <div className={cx('container')}>
            <input
                type="text"
                name="search"
                id="searchInput"
                placeholder={t('placeholder')}
                value={query}
                onChange={handleInputChange}
            />
            {query ? (
                <div className={cx('close-icon-wrapper')}>
                    <IoMdCloseCircle className={cx('close-icon')} onClick={handleClearSearch} />
                </div>
            ) : (
                <div className={cx('search-icon-wrapper')} onClick={handleSearch}>
                    <FaSearch className={cx('search-icon')} />
                </div>
            )}
        </div>
    );
};

Search.propTypes = {
    query: PropTypes.string.isRequired,
    setQuery: PropTypes.func.isRequired,
    handleSearch: PropTypes.func.isRequired,
};

export default Search;
