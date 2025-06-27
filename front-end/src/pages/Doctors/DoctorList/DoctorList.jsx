import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './DoctorList.module.scss';
import Search from '../../../components/Search/Search';
import DoctorCard from '../../../components/DoctorCard/DoctorCard';
import Panigation from '../../../components/Pagination/Pagination';
import { BASE_URL } from '../../../../config';
import useFetchData from '../../../hooks/useFetchData';
import Loader from '../../../components/Loader/Loader';
import Error from '../../../components/Error/Error';
import { Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import specialties from '../../../assets/data/mock-data/specialties';

const cx = classNames.bind(styles);

const DoctorList = () => {
    const { t } = useTranslation(['doctorList', 'specialties']);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const { data: doctors, loading, error } = useFetchData(`${BASE_URL}/doctors?query=${debouncedQuery}`);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [currentItems, setCurrentItems] = useState([]);
    const itemsPerPage = 12;

    const handleSearch = () => {
        setQuery(query.trim());
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query);
        }, 700);
        return () => clearTimeout(timeout);
    }, [query]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const specialtiesData = i18n.getResource(i18n.language, 'specialties');
    const specialtyOptions = Object.entries(specialtiesData).map(([key, value]) => ({
        key,
        value: value.name,
    }));

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            sx: {
                width: '330px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                boxSizing: 'border-box',
                overflow: 'hidden',
            },
        },
        MenuListProps: {
            sx: {
                maxHeight: ITEM_HEIGHT * ITEM_PADDING_TOP,
                overflowY: 'auto',
                padding: '8px 0',
                boxSizing: 'border-box',
                '&::-webkit-scrollbar-button': { display: 'none' },
            },
        },
    };

    const customStyles = {
        '& .MuiSelect-select': {
            fontFamily: '"Manrope", sans-serif',
            fontWeight: '520',
            padding: '0 25px',
            display: 'flex',
            alignItems: 'center',
            lineHeight: '56px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: '2px solid var(--lightGrayColor)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '50px',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--lightGrayColor)',
            boxShadow: '0 4px 20px var(--lightGreenColor)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primaryColor)',
            boxShadow: '0 4px 20px var(--lightGreenColor)',
        },
    };

    const getSpecialtyIdFromName = (name) => specialties.find((item) => item.name === name)?.id;
    const officialDoctors = doctors.filter((doctor) => {
        const doctorId = getSpecialtyIdFromName(doctor.specialty);
        return doctor.isApproved === 'approved' && (selectedSpecialty === '' || doctorId === selectedSpecialty);
    });

    useEffect(() => {
        const offset = currentPage * itemsPerPage;
        const items = officialDoctors.slice(offset, offset + itemsPerPage);
        setCurrentItems(items);
    }, [currentPage, officialDoctors, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(0);
    }, [selectedSpecialty, debouncedQuery]);

    return (
        <div className={cx('container')}>
            <h2>{t('heading')}</h2>
            <p className={cx('description')}>{t('description')}</p>

            <div className={cx('query')}>
                <Select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    MenuProps={MenuProps}
                    inputProps={{ sx: { height: '50px' } }}
                    sx={customStyles}
                    displayEmpty
                    renderValue={(selected) => {
                        const selectedOption = specialtyOptions.find((opt) => opt.key === selected);
                        return selectedOption ? selectedOption.value : t('allSpecialties');
                    }}
                >
                    <MenuItem
                        value=""
                        sx={{
                            '&:hover': { backgroundColor: 'var(--lightGreenColor)' },
                            backgroundColor:
                                selectedSpecialty === '' ? 'var(--primaryColor) !important' : 'transparent',
                            fontWeight: selectedSpecialty === '' ? '500' : 'normal',
                        }}
                    >
                        {t('allSpecialties')}
                    </MenuItem>
                    {specialtyOptions.map((option) => (
                        <MenuItem
                            key={option.key}
                            value={option.key}
                            sx={{
                                '&:hover': { backgroundColor: 'var(--lightGreenColor)' },
                                backgroundColor:
                                    selectedSpecialty === option.key ? 'var(--primaryColor) !important' : 'transparent',
                                fontWeight: selectedSpecialty === option.key ? '500' : 'normal',
                            }}
                        >
                            {option.value}
                        </MenuItem>
                    ))}
                </Select>

                <Search query={query} setQuery={setQuery} handleSearch={handleSearch} />
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <Error errorMessage={error} />
            ) : (
                <div className={cx('doctors-wrapper')}>
                    <div className={cx('doctors')}>
                        {officialDoctors.length > 0 &&
                            currentItems.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)}
                    </div>
                    {!loading && officialDoctors.length > itemsPerPage && (
                        <Panigation
                            data={officialDoctors}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default DoctorList;
