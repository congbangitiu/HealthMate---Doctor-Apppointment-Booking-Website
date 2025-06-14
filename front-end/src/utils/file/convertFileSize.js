const convertFileSize = (fileSize) => {
    if (fileSize < 1024) {
        return `${fileSize} B`; // Bytes
    } else if (fileSize >= 1024 && fileSize < 1024 * 1024) {
        return `${(fileSize / 1024).toFixed(2)} KB`; // Kilobytes
    } else if (fileSize >= 1024 * 1024 && fileSize < 1024 * 1024 * 1024) {
        return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`; // Megabytes
    } else if (fileSize >= 1024 * 1024 * 1024) {
        return `${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB`; // Gigabytes
    }
};

export default convertFileSize;


