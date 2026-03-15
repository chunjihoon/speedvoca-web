import {
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    signOut,
  } from "firebase/auth";
  import { auth } from "./firebase";
  
  const provider = new GoogleAuthProvider();
  
  export async function loginWithGoogle() {
    await setPersistence(auth, browserLocalPersistence);
  
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Popup login failed, falling back to redirect:", error);
      await signInWithRedirect(auth, provider);
    }
  }
  
  export async function logout() {
    await signOut(auth);
  }
  