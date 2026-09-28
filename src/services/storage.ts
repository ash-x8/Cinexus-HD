import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { MediaFile } from '../types';

export interface UploadProgressCallback {
  (progressPercent: number, bytesTransferred: number, totalBytes: number): void;
}

export async function uploadMediaFile(
  file: File,
  category: 'poster' | 'backdrop' | 'video' | 'subtitle' | 'logo' | 'other' = 'poster',
  onProgress?: UploadProgressCallback
): Promise<MediaFile> {
  // Validate file size: 500MB max for videos, 10MB max for images
  const maxBytes = category === 'video' ? 500 * 1024 * 1024 : 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))}MB).`);
  }

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `media/${category}/${Date.now()}_${cleanFileName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      category
    }
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(percent, snapshot.bytesTransferred, snapshot.totalBytes);
        }
      },
      (error) => {
        console.error('[Firebase Storage] Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const mediaDoc: Omit<MediaFile, 'id'> = {
            name: file.name,
            url: downloadUrl,
            storagePath,
            size: file.size,
            contentType: file.type,
            category,
            createdAt: new Date().toISOString()
          };

          const docRef = await addDoc(collection(db, 'media'), mediaDoc);
          resolve({
            id: docRef.id,
            ...mediaDoc
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function deleteMediaFile(mediaId: string, storagePath?: string): Promise<void> {
  try {
    if (storagePath) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef).catch((err) => {
        console.warn('[Firebase Storage] Storage object deletion warning:', err);
      });
    }
    await deleteDoc(doc(db, 'media', mediaId));
  } catch (error) {
    console.error('[Firebase Storage] Delete media failed:', error);
    throw error;
  }
}

export async function getMediaFiles(): Promise<MediaFile[]> {
  try {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaFile));
  } catch (err) {
    console.warn('[Firebase Storage] Fetch media list error:', err);
    return [];
  }
}
