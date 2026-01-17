import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

const firebaseConfig = {
  apiKey: "AIzaSyCdXca_GBdZKdovME-wvk-tH9KRL2btj6o",
  authDomain: "firm-foundation-484104-j4.firebaseapp.com",
  projectId: "firm-foundation-484104-j4",
  storageBucket: "firm-foundation-484104-j4.firebasestorage.app",
  messagingSenderId: "497535913778",
  appId: "1:497535913778:web:91b8fabff94a43c635112b",
  measurementId: "G-3FFT9HSV5L"
};

const ensureConfig = () => {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }
};

const app = (() => {
  ensureConfig();
  return initializeApp(firebaseConfig);
})();

export const auth = getAuth(app);

export const onAuthStateChangedListener = (callback) => onAuthStateChanged(auth, callback);

const buildGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  // YouTube playlists scope
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
  provider.setCustomParameters({
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return provider;
};

export const signInWithGoogle = async ({ useRedirect = false } = {}) => {
  const provider = buildGoogleProvider();
  if (useRedirect) {
    await signInWithRedirect(auth, provider);
    return null;
  }
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return { user: result.user, accessToken: credential?.accessToken || null };
};

export const getRedirectAccessToken = async () => {
  const result = await getRedirectResult(auth);
  if (!result) {
    return null;
  }
  const credential = GoogleAuthProvider.credentialFromResult(result);
  return { user: result.user, accessToken: credential?.accessToken || null };
};

export const signOutUser = async () => signOut(auth);
