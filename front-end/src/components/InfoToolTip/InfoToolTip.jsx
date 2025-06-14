import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { PropTypes } from 'prop-types';
import truncateText from '../../utils/text/truncateText';

const GeneralTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
    ({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: theme.palette.common.white,
            color: '#8a92a6',
            boxShadow: theme.shadows[1],
            fontSize: 14,
        },
    }),
);

const InfoToolTip = ({ text, maxLength, customStyle }) => {
    return (
        <div style={customStyle}>
            {text?.length > maxLength ? (
                <GeneralTooltip title={text} placement="top">
                    {truncateText(text, maxLength)}
                </GeneralTooltip>
            ) : (
                <>{text}</>
            )}
        </div>
    );
};

InfoToolTip.propTypes = {
    text: PropTypes.string.isRequired,
    maxLength: PropTypes.number,
    customStyle: PropTypes.object,
};

export default InfoToolTip;
