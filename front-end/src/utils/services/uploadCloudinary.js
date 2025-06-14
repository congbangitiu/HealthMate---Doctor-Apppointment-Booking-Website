const upload_preset = import.meta.env.VITE_UPLOAD_PRESET;
const cloud_name = import.meta.env.VITE_CLOUD_NAME;

export const uploadImageToCloudinary = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', upload_preset);
    uploadData.append('cloud_name', cloud_name);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: 'post',
        body: uploadData,
    });

    const data = await res.json();
    return data;
};

export const uploadVideoToCloudinary = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', upload_preset);
    uploadData.append('cloud_name', cloud_name);
    uploadData.append('resource_type', 'video');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`, {
        method: 'post',
        body: uploadData,
    });

    const data = await res.json();
    return data;
};

export const uploadDocumentToCloudinary = async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', upload_preset);
    uploadData.append('cloud_name', cloud_name);
    uploadData.append('resource_type', 'raw');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`, {
        method: 'post',
        body: uploadData,
    });

    const data = await res.json();
    return data;
};
