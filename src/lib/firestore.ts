import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  export type ChapterMeta = {
    customTitle?: string;
  };
  
  function chapterDocId(sheetName: string) {
    return encodeURIComponent(sheetName);
  }
  
  export async function ensureUserProfile(params: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }) {
    const { uid, email, displayName, photoURL } = params;
  
    await setDoc(
      doc(db, "users", uid),
      {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  
  export async function loadUserChapterMeta(uid: string): Promise<Record<string, ChapterMeta>> {
    const snap = await getDocs(collection(db, "users", uid, "chapterMeta"));
    const result: Record<string, ChapterMeta> = {};
  
    snap.forEach((docSnap) => {
      const data = docSnap.data() as ChapterMeta & { sheetName?: string };
      if (data.sheetName) {
        result[data.sheetName] = {
          customTitle: data.customTitle ?? "",
        };
      }
    });
  
    return result;
  }
  
  export async function saveChapterTitle(uid: string, sheetName: string, customTitle: string) {
    await setDoc(
      doc(db, "users", uid, "chapterMeta", chapterDocId(sheetName)),
      {
        sheetName,
        customTitle,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  