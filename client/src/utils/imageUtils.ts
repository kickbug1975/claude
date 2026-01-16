import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
    const options = {
        maxSizeMB: 1, // Max size 1MB
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
    };

    try {
        const compressedFile = await imageCompression(file, options);

        // Ensure we return a File object with the original name and type
        // browser-image-compression might return a Blob which lacks 'name' property
        if (compressedFile instanceof Blob && !(compressedFile instanceof File)) {
            return new File([compressedFile], file.name, {
                type: (compressedFile as Blob).type,
                lastModified: Date.now()
            });
        }

        return compressedFile as File;
    } catch (error) {
        console.error('Erreur compression image:', error);
        return file; // Return original if compression fails
    }
};
