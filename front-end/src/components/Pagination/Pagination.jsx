import styles from './Pagination.module.scss';
import classNames from 'classnames/bind';
import Paginate from 'react-paginate';
import { PropTypes } from 'prop-types';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

const cx = classNames.bind(styles);

const Pagination = ({ data, itemsPerPage, currentPage, setCurrentPage }) => {
    const { t } = useTranslation('pagination');
    const isMobile = useMediaQuery('(max-width:768px)');
    const pageCount = Math.ceil(data.length / itemsPerPage);

    const handlePageClick = (event) => {
        const selectedPage = event.selected;
        setCurrentPage(selectedPage);

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <div className={cx('container')}>
            <Paginate
                previousLabel={!isMobile ? t('previous') : '<'}
                nextLabel={!isMobile ? t('next') : '>'}
                breakLabel={'...'}
                breakClassName={'break-me'}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={cx('pagination')}
                subContainerClassName={cx('pages', 'pagination')}
                activeClassName={cx('active')}
                disabledClassName={cx('disabled')}
                forcePage={currentPage}
                marginPagesDisplayed={!isMobile ? 3 : 2}
                pageRangeDisplayed={!isMobile ? 2 : 1}
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
