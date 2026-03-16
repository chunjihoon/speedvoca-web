import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    serverTimestamp,
    setDoc,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  export type ChapterMeta = {
    customTitle?: string;
    completedSentenceCount?: number;
    nextCount?: number;
    replayCount?: number;
    favoriteCount?: number;
    randomEnabled?: boolean;
    fontScale?: number;
  };
  
  export type FavoriteItem = {
    sheetName: string;
    sentence: string;
    translation: string;
    createdAt?: unknown;
  };
  
  export type UserStats = {
    totalCompletedSentenceCount: number;
    totalNextCount: number;
    totalReplayCount: number;
  };
  
  function chapterDocId(sheetName: string) {
    return encodeURIComponent(sheetName);
  }
  
  function favoriteDocId(sheetName: string, sentence: string) {
    return encodeURIComponent(`${sheetName}__${sentence}`);
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
            completedSentenceCount: data.completedSentenceCount ?? 0,
            nextCount: data.nextCount ?? 0,
            replayCount: data.replayCount ?? 0,
            favoriteCount: data.favoriteCount ?? 0,
            randomEnabled: data.randomEnabled ?? false,
            fontScale: data.fontScale ?? 1,
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
  
  async function bumpChapterStats(
    uid: string,
    sheetName: string,
    updates: Partial<Record<"completedSentenceCount" | "nextCount" | "replayCount" | "favoriteCount", number>>
  ) {
    const payload: Record<string, unknown> = {
      sheetName,
      updatedAt: serverTimestamp(),
    };
  
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === "number" && value !== 0) {
        payload[key] = increment(value);
      }
    });
  
    await setDoc(doc(db, "users", uid, "chapterMeta", chapterDocId(sheetName)), payload, { merge: true });
  }
  
  async function bumpUserStats(
    uid: string,
    updates: Partial<Record<"totalCompletedSentenceCount" | "totalNextCount" | "totalReplayCount", number>>
  ) {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
  
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === "number" && value !== 0) {
        payload[key] = increment(value);
      }
    });
  
    await setDoc(doc(db, "users", uid), payload, { merge: true });
  }
  
  export async function recordReplay(uid: string, sheetName: string) {
    await Promise.all([
      bumpChapterStats(uid, sheetName, { replayCount: 1 }),
      bumpUserStats(uid, { totalReplayCount: 1 }),
    ]);
  }
  
  export async function recordNext(uid: string, sheetName: string) {
    await Promise.all([
      bumpChapterStats(uid, sheetName, { nextCount: 1 }),
      bumpUserStats(uid, { totalNextCount: 1 }),
    ]);
  }
  
  export async function recordCompletedTap(uid: string, sheetName: string) {
    await Promise.all([
      bumpChapterStats(uid, sheetName, { completedSentenceCount: 1 }),
      bumpUserStats(uid, { totalCompletedSentenceCount: 1 }),
    ]);
  }
  
  export async function loadUserStats(uid: string): Promise<UserStats> {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data() as Partial<UserStats> | undefined;
  
    return {
      totalCompletedSentenceCount: data?.totalCompletedSentenceCount ?? 0,
      totalNextCount: data?.totalNextCount ?? 0,
      totalReplayCount: data?.totalReplayCount ?? 0,
    };
  }
  
  export async function toggleFavorite(params: {
    uid: string;
    sheetName: string;
    sentence: string;
    translation: string;
  }) {
    const { uid, sheetName, sentence, translation } = params;
    const id = favoriteDocId(sheetName, sentence);
    const ref = doc(db, "users", uid, "favorites", id);
    const snap = await getDoc(ref);
  
    if (snap.exists()) {
      await Promise.all([
        deleteDoc(ref),
        bumpChapterStats(uid, sheetName, { favoriteCount: -1 }),
      ]);
      return { active: false };
    }
  
    await Promise.all([
      setDoc(ref, {
        sheetName,
        sentence,
        translation,
        createdAt: serverTimestamp(),
      }),
      bumpChapterStats(uid, sheetName, { favoriteCount: 1 }),
    ]);
  
    return { active: true };
  }
  
  export async function loadFavorites(uid: string): Promise<FavoriteItem[]> {
    const snap = await getDocs(collection(db, "users", uid, "favorites"));
    const items: FavoriteItem[] = [];
  
    snap.forEach((docSnap) => {
      const data = docSnap.data() as FavoriteItem;
      if (data.sentence?.trim()) {
        items.push({
          sheetName: data.sheetName,
          sentence: data.sentence,
          translation: data.translation ?? "",
          createdAt: data.createdAt,
        });
      }
    });
  
    return items;
  }
  
  export async function isFavorite(uid: string, sheetName: string, sentence: string) {
    const id = favoriteDocId(sheetName, sentence);
    const snap = await getDoc(doc(db, "users", uid, "favorites", id));
    return snap.exists();
  }
  
  export type ImportedChapter = {
    id: string;
    title: string;
    rows: {
      sentence: string;
      translation: string;
      sourceSheetName?: string;
    }[];
    createdAt?: unknown;
  };
  
  export async function saveImportedChapter(params: {
    uid: string;
    title: string;
    rows: { sentence: string; translation: string }[];
  }) {
    const { uid, title, rows } = params;
  
    const chapterId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
    await setDoc(doc(db, "users", uid, "importedChapters", chapterId), {
      title,
      rows,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  
    return chapterId;
  }
  
  export async function loadImportedChapters(uid: string): Promise<ImportedChapter[]> {
    const snap = await getDocs(collection(db, "users", uid, "importedChapters"));
    const items: ImportedChapter[] = [];
  
    snap.forEach((docSnap) => {
      const data = docSnap.data() as {
        title?: string;
        rows?: { sentence: string; translation: string }[];
        createdAt?: unknown;
      };
  
      if (!data.title || !Array.isArray(data.rows) || data.rows.length === 0) return;
  
      items.push({
        id: docSnap.id,
        title: data.title,
        rows: data.rows.map((row) => ({
          sentence: row.sentence,
          translation: row.translation ?? "",
          sourceSheetName: data.title,
        })),
        createdAt: data.createdAt,
      });
    });
  
    return items;
  }

  export type ChapterSettings = {
    randomEnabled?: boolean;
    fontScale?: number;
  };
  
  export async function saveChapterSettings(params: {
    uid: string;
    sheetName: string;
    randomEnabled?: boolean;
    fontScale?: number;
  }) {
    const { uid, sheetName, randomEnabled, fontScale } = params;
  
    const payload: Record<string, unknown> = {
      sheetName,
      updatedAt: serverTimestamp(),
    };
  
    if (typeof randomEnabled === "boolean") {
      payload.randomEnabled = randomEnabled;
    }
  
    if (typeof fontScale === "number") {
      payload.fontScale = fontScale;
    }
  
    await setDoc(
      doc(db, "users", uid, "chapterMeta", chapterDocId(sheetName)),
      payload,
      { merge: true }
    );
  }
  
  export async function deleteImportedChapter(uid: string, chapterTitle: string) {
    const snap = await getDocs(collection(db, "users", uid, "importedChapters"));
  
    const targets = snap.docs.filter((docSnap) => {
      const data = docSnap.data() as { title?: string };
      return data.title === chapterTitle;
    });
  
    await Promise.all(targets.map((docSnap) => deleteDoc(docSnap.ref)));
  }
  
  