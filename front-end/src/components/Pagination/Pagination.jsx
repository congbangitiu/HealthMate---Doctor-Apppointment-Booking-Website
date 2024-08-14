import styles from './Pagination.module.scss';
import classNames from 'classnames/bind';
import Paginate from 'react-paginate';
import { PropTypes } from 'prop-types';

const cx = classNames.bind(styles);

const Pagination = ({ data, itemsPerPage, currentPage, setCurrentPage, setCurrentItems }) => {
    const pageCount = Math.ceil(data.length / itemsPerPage);

    const handlePageClick = (event) => {
        const selectedPage = event.selected;
        setCurrentPage(selectedPage);

        const offset = selectedPage * itemsPerPage;
        const currentItems = data.slice(offset, offset + itemsPerPage);
        setCurrentItems(currentItems);

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <div className={cx('container')}>
            <Paginate
                previousLabel={'Previous'}
                nextLabel={'Next'}
                breakLabel={'...'}
                breakClassName={'break-me'}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={cx('pagination')}
                subContainerClassName={cx('pages', 'pagination')}
                activeClassName={cx('active')}
                disabledClassName={cx('disabled')}
                forcePage={currentPage}
            />
        </div>
    );
};

Pagination.propTypes = {
    data: PropTypes.array.isRequired,
    itemsPerPage: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    setCurrentPage: PropTypes.func.isRequired,
    setCurrentItems: PropTypes.func.isRequired,
};

export default Pagination;
