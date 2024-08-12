import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './AdminSearch.module.scss';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';

const cx = classNames.bind(styles);

const AdminSearch = ({ title, total, placeholder, query, setQuery }) => {
    const handleSearch = () => {
        setQuery(query.trim());
    };

    const handleInputChange = (e) => {
        const updatedQuery = e.target.value.replace(/^\s+/, '');
        setQuery(updatedQuery);
    };

    const handleClearSearch = () => {
        setQuery('');
    };
    return (
        <div className={cx('container')}>
            <h4>
                {title} ({total})
            </h4>
            <div className={cx('search-wrapper')}>
                <input
                    type="text"
                    name="search"
                    id="searchInput"
                    placeholder={placeholder}
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
        </div>
    );
};

AdminSearch.propTypes = {
    title: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    placeholder: PropTypes.string,
    query: PropTypes.string.isRequired,
    setQuery: PropTypes.func.isRequired,
};

export default AdminSearch;
