import React from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AdminCMS as AdminCMSComponent } from './AdminCMS';

/**
 * Data Sanitization before Firestore Write
 * Strips out or converts all undefined values to empty strings
 */
export const sanitizePayload = (data) => {
  const cleanObj = {};
  Object.keys(data).forEach((key) => {
    cleanObj[key] = data[key] === undefined ? "" : data[key];
  });
  return cleanObj;
};

/**
 * Clean helper function to save a movie record to Firestore
 * with automatic payload sanitization
 */
export const saveMovieToFirestore = async (movieId, payload) => {
  if (!movieId) throw new Error("Missing movieId");
  const cleanData = sanitizePayload(payload);
  await setDoc(doc(db, "movies", movieId), cleanData, { merge: true });
  return cleanData;
};

export const AdminCMS = AdminCMSComponent;
export default AdminCMSComponent;
