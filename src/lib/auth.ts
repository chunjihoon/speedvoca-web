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
  
  function isMobileLike() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
  
  export async function loginWithGoogle() {
    await setPersistence(auth, browserLocalPersistence);
  
    if (isMobileLike()) {
      await signInWithRedirect(auth, provider);
      return;
    }
  
    await signInWithPopup(auth, provider);
  }
  
  export async function logout() {
    await signOut(auth);
  }
  