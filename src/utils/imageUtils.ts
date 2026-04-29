
/**
 * Compresses an image to be roughly under a certain size in KB
 * @param base64Str The image data as a base64 string
 * @param maxWidth The maximum width for the image
 * @param maxHeight The maximum height for the image
 * @param quality Initial quality (0 to 1)
 * @param maxSizeKB The target maximum size in KB
 * @returns A promise that resolves to the compressed base64 string
 */
export const compressImage = (
  base64Str: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.7,
  maxSizeKB: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Recursive function to adjust quality if size is still too large
      const getCompressed = (currentQuality: number): string => {
        const compressed = canvas.toDataURL('image/jpeg', currentQuality);
        
        // Estimate size from base64 (approx 3/4 of string length)
        const sizeKB = (compressed.length * 3) / 4 / 1024;
        
        if (sizeKB > maxSizeKB && currentQuality > 0.1) {
          return getCompressed(currentQuality - 0.1);
        }
        return compressed;
      };

      try {
        const result = getCompressed(quality);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
  });
};
