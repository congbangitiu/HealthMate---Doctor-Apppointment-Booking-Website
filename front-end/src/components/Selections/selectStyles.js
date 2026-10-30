export const getSelectionStyles = (width = '100%') => ({
    control: (provided) => ({
        ...provided,
        border: '2px solid var(--primaryColor)',
        borderRadius: '5px',
        boxShadow: 'none',
        width,
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        '&:hover': { cursor: 'text' },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? 'var(--primaryColor)' : state.isFocused ? 'var(--lightGreenColor)' : 'white',
        color: state.isSelected ? 'white' : 'black',
        '&:hover': { backgroundColor: 'var(--lightGreenColor)' },
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
});
