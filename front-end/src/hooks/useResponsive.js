import { useMediaQuery } from '@mui/material';

export const MOBILE_QUERY = '(max-width: 768px)';
export const TABLET_QUERY = '(min-width: 769px) and (max-width: 1024px)';
export const TABLET_OR_MOBILE_QUERY = '(max-width: 1024px)';

const useResponsive = () => {
    const isMobile = useMediaQuery(MOBILE_QUERY);
    const isTablet = useMediaQuery(TABLET_QUERY);
    const isTabletOrMobile = useMediaQuery(TABLET_OR_MOBILE_QUERY);

    return { isMobile, isTablet, isTabletOrMobile };
};

export default useResponsive;
