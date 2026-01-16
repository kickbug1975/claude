import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 1, // Max size 1MB
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Maintain original name and type if changed by library (usually library handles it well) - but let's be safe if needed. 
        // Actually browser-image-compression returns a Blob/File with mostly correct props.
        // Let's just return it.
        return compressedFile;
    } catch (error) {
        console.error('Erreur compression image:', error);
        return file; // Return original if compression fails
    }
};
