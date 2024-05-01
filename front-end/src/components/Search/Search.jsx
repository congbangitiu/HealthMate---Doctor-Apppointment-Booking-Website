import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './Search.module.scss';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';

const cx = classNames.bind(styles);

const Search = ({ query, setQuery, handleSearch }) => {
    const handleInputChange = (e) => {
        const updatedQuery = e.target.value.replace(/^\s+/, '');
        setQuery(updatedQuery);
    };

    const handleClearSearch = () => {
        setQuery('');
    };

    return (
        <div className={cx('container')}>
            <h2>Find a doctor</h2>
            <div className={cx('search-wrapper')}>
                <input
                    type="text"
                    name="search"
                    id="searchInput"
                    placeholder="Type doctor's name or specialization ..."
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

Search.propTypes = {
    query: PropTypes.string.isRequired,
    setQuery: PropTypes.func.isRequired,
    handleSearch: PropTypes.func.isRequired,
};

export default Search;
