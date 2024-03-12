import React from 'react';
import classNames from 'classnames/bind';
import styles from './Search.module.scss';
import { FaSearch } from "react-icons/fa";

const cx = classNames.bind(styles);

const Search = () => {
    return (
        <div className={cx('container')}>
            <h2>Find a doctor</h2>
            <div className={cx('search-wrapper')}>
                <input type="text" name="" id="" placeholder='Type a name to look for a doctor ...'/>
                <div className={cx('search-icon-wrapper')}>
                    <FaSearch className={cx('search-icon')}/>
                </div>
            </div>
        </div>
    );
};

export default Search;
