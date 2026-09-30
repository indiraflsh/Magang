import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Optimizes an image file by resizing it to a standard avatar dimension (max 512x512)
 * and compressing it, preventing local storage quota exhaustion and reducing bandwidth.
 */
export async function optimizeAvatarImage(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format file tidak didukung. Harap pilih file gambar (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding to MAX_DIM
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw dataUrl
          resolve({
            dataUrl: readerEvent.target?.result as string,
            blob: file
          });
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to quality WebP or JPEG
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.88);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({
                dataUrl,
                blob: file
              });
            }
          },
          mimeType,
          0.88
        );
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses berkas gambar terpilih.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas dari galeri perangkat.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an avatar image either to Supabase Storage (bucket 'avatars')
 * or returns an optimized base64 Data URL if in demo mode / fallback.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string; isRemote: boolean; error?: string }> {
  try {
    // 1. Optimize image first
    const { dataUrl, blob } = await optimizeAvatarImage(file);

    // 2. If Supabase is live, attempt storage upload
    if (isSupabaseConfigured) {
      try {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `${userId}/${Date.now()}_avatar.${fileExt}`;

        // Attempt upload to Supabase Storage bucket 'avatars'
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              isRemote: true
            };
          }
        } else {
          console.warn('Supabase storage upload error, falling back to local dataUrl:', uploadError.message);
        }
      } catch (err) {
        console.warn('Supabase storage exception, falling back to dataUrl:', err);
      }
    }

    // 3. Fallback / Demo Mode: return high-quality optimized Data URL
    return {
      url: dataUrl,
      isRemote: false
    };
  } catch (err: any) {
    return {
      url: '',
      isRemote: false,
      error: err.message || 'Gagal memproses gambar avatar'
    };
  }
}

/**
 * Uploads a journal documentation/attachment photo either to Supabase Storage
 * (bucket 'journal-attachments') or returns an optimized Data URL.
 */
export async function uploadJournalAttachment(
  internshipId: string,
  file: File
): Promise<{ url: string; isRemote: boolean; error?: string }> {
  try {
    const { dataUrl, blob } = await optimizeAvatarImage(file);

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `${internshipId}/${Date.now()}_attachment.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('journal-attachments')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('journal-attachments')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              isRemote: true
            };
          }
        }
      } catch (err) {
        console.warn('Supabase journal attachment storage error, using dataUrl:', err);
      }
    }

    return {
      url: dataUrl,
      isRemote: false
    };
  } catch (err: any) {
    return {
      url: '',
      isRemote: false,
      error: err.message || 'Gagal memproses lampiran'
    };
  }
}

