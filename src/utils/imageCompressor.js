/**
 * Image Compressor Utility (Client-Side Optimization via HTML5 Canvas)
 * Sesuai PRD FR-06.1:
 * Gambar > 2 MB otomatis dikompres ke JPEG 70% quality sebelum diunggah ke Firebase Storage.
 */

export async function compressImageIfNeeded(file, maxSizeMB = 2, quality = 0.7) {
  // Jika bukan tipe gambar atau ukuran <= maxSizeMB, kembalikan file asli
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (!file.type.startsWith('image/') || file.size <= maxSizeBytes) {
    return {
      file,
      wasCompressed: false,
      originalSize: file.size,
      compressedSize: file.size
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // Hitung scaling jika dimensi terlalu besar (max 1920x1080)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Gambar background putih jika PNG transparan diubah ke JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, wasCompressed: false, originalSize: file.size, compressedSize: file.size });
              return;
            }

            // Buat File object baru dengan nama berakhiran .jpg
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
            const compressedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              wasCompressed: true,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: ((1 - (compressedFile.size / file.size)) * 100).toFixed(1)
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => {
        console.error("Gagal memproses gambar untuk kompresi:", err);
        resolve({ file, wasCompressed: false, originalSize: file.size, compressedSize: file.size });
      };
    };

    reader.onerror = (err) => {
      console.error("Gagal membaca file gambar:", err);
      resolve({ file, wasCompressed: false, originalSize: file.size, compressedSize: file.size });
    };
  });
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
