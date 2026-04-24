import type { ChapterLanguage } from "../types/content";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  increment,
  runTransaction,
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
  language?: ChapterLanguage;
  sentence: string;
  translation: string;
  createdAt?: unknown;
};

export type UserStats = {
  totalCompletedSentenceCount: number;
  totalNextCount: number;
  totalReplayCount: number;
};

export type UserStatsDelta = Partial<
  Record<"totalCompletedSentenceCount" | "totalNextCount" | "totalReplayCount", number>
>;

function chapterDocId(sheetName: string) {
  return encodeURIComponent(sheetName);
}

function favoriteDocIdLegacy(sheetName: string, sentence: string) {
  return encodeURIComponent(`${sheetName}__${sentence}`);
}

function favoriteDocId(sheetName: string, language: ChapterLanguage, sentence: string) {
  return encodeURIComponent(`${sheetName}__${language}__${sentence}`);
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

export async function loadReaderGuideSeen(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  const data = snap.data() as { readerGuideSeen?: boolean };
  return data.readerGuideSeen === true;
}

export async function saveReaderGuideSeen(uid: string) {
  await setDoc(
    doc(db, "users", uid),
    {
      readerGuideSeen: true,
      updatedAt: serverTimestamp(),
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
  updates: Partial<
    Record<"completedSentenceCount" | "nextCount" | "replayCount" | "favoriteCount", number>
  >
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

  await setDoc(doc(db, "users", uid, "chapterMeta", chapterDocId(sheetName)), payload, {
    merge: true,
  });
}

async function bumpUserStats(
  uid: string,
  updates: UserStatsDelta
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

export async function applyUserStatsDelta(uid: string, updates: UserStatsDelta) {
  await bumpUserStats(uid, updates);
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
  language: ChapterLanguage;
  sentence: string;
  translation: string;
}) {
  const { uid, sheetName, language, sentence, translation } = params;
  const id = favoriteDocId(sheetName, language, sentence);
  const ref = doc(db, "users", uid, "favorites", id);
  const legacyRef = doc(db, "users", uid, "favorites", favoriteDocIdLegacy(sheetName, sentence));
  const [snap, legacySnap] = await Promise.all([getDoc(ref), getDoc(legacyRef)]);

  if (snap.exists() || legacySnap.exists()) {
    await Promise.all([
      snap.exists() ? deleteDoc(ref) : Promise.resolve(),
      legacySnap.exists() ? deleteDoc(legacyRef) : Promise.resolve(),
      bumpChapterStats(uid, sheetName, { favoriteCount: -1 }),
    ]);
    return { active: false };
  }

  await Promise.all([
    setDoc(ref, {
      sheetName,
      language,
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
        language: data.language ?? "en-US",
        sentence: data.sentence,
        translation: data.translation ?? "",
        createdAt: data.createdAt,
      });
    }
  });

  return items;
}

export async function isFavorite(uid: string, sheetName: string, sentence: string) {
  const legacySnap = await getDoc(
    doc(db, "users", uid, "favorites", favoriteDocIdLegacy(sheetName, sentence))
  );
  return legacySnap.exists();
}

export async function isFavoriteByLanguage(
  uid: string,
  sheetName: string,
  language: ChapterLanguage,
  sentence: string
) {
  const id = favoriteDocId(sheetName, language, sentence);
  const [snap, legacySnap] = await Promise.all([
    getDoc(doc(db, "users", uid, "favorites", id)),
    getDoc(doc(db, "users", uid, "favorites", favoriteDocIdLegacy(sheetName, sentence))),
  ]);
  return snap.exists() || legacySnap.exists();
}

export type ImportedChapter = {
  id: string;
  title: string;
  language: ChapterLanguage;
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
  language: ChapterLanguage;
  rows: { sentence: string; translation: string }[];
}) {
  const { uid, title, language, rows } = params;

  const chapterId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  await setDoc(doc(db, "users", uid, "importedChapters", chapterId), {
    title,
    language,
    rows,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return chapterId;
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function saveImportedChapterWithDailyLimit(params: {
  uid: string;
  title: string;
  language: ChapterLanguage;
  rows: { sentence: string; translation: string }[];
  dailyLimit: number;
}) {
  const { uid, title, language, rows, dailyLimit } = params;
  const dateKey = getLocalDateKey();
  const usageRef = doc(db, "users", uid, "manualImportUsage", dateKey);
  const chapterId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const chapterRef = doc(db, "users", uid, "importedChapters", chapterId);

  return runTransaction(db, async (tx) => {
    const usageSnap = await tx.get(usageRef);
    const currentCount = usageSnap.exists()
      ? Math.max(0, Number((usageSnap.data() as { count?: number }).count ?? 0))
      : 0;

    if (currentCount + rows.length > dailyLimit) {
      return {
        ok: false as const,
        reason: "daily_limit_exceeded" as const,
        remaining: Math.max(0, dailyLimit - currentCount),
      };
    }

    const usagePayload: {
      count: number;
      updatedAt: unknown;
      createdAt?: unknown;
    } = {
      count: currentCount + rows.length,
      updatedAt: serverTimestamp(),
    };
    if (!usageSnap.exists()) {
      usagePayload.createdAt = serverTimestamp();
    }
    tx.set(usageRef, usagePayload, { merge: true });

    tx.set(chapterRef, {
      title,
      language,
      rows,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ok: true as const,
      chapterId,
      remaining: Math.max(0, dailyLimit - (currentCount + rows.length)),
    };
  });
}

export async function loadManualImportDailyRemaining(uid: string, dailyLimit: number) {
  const dateKey = getLocalDateKey();
  const usageRef = doc(db, "users", uid, "manualImportUsage", dateKey);
  const usageSnap = await getDoc(usageRef);
  const currentCount = usageSnap.exists()
    ? Math.max(0, Number((usageSnap.data() as { count?: number }).count ?? 0))
    : 0;
  return Math.max(0, dailyLimit - currentCount);
}

export async function loadImportedChapters(uid: string): Promise<ImportedChapter[]> {
  const snap = await getDocs(collection(db, "users", uid, "importedChapters"));
  const items: ImportedChapter[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() as {
      title?: string;
      language?: ChapterLanguage;
      rows?: { sentence: string; translation: string }[];
      createdAt?: unknown;
    };

    if (!data.title || !Array.isArray(data.rows) || data.rows.length === 0) return;

    items.push({
      id: docSnap.id,
      title: data.title,
      language: data.language ?? "en-US",
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

export async function deleteImportedChapter(uid: string, chapterId: string) {
  await deleteDoc(doc(db, "users", uid, "importedChapters", chapterId));
}

export type NetworkErrorReportPayload = {
  uid: string;
  occurredAtISO: string;
  errorDetail: string;
  errorMessage: string;
  source: string;
  accountEmail: string | null;
  environment: {
    deviceType: "pc" | "mobile";
    browser: string;
    isWebView: boolean;
    webViewVendor: string | null;
    userAgent: string;
    language: string;
    platform: string;
    viewport: string;
  };
};

export async function saveNetworkErrorReport(payload: NetworkErrorReportPayload) {
  const reportRef = doc(collection(db, "errorReports"));
  await setDoc(reportRef, {
    reportType: "network",
    uid: payload.uid,
    occurredAtISO: payload.occurredAtISO,
    errorDetail: payload.errorDetail,
    errorMessage: payload.errorMessage,
    source: payload.source,
    accountEmail: payload.accountEmail,
    environment: payload.environment,
    createdAt: serverTimestamp(),
  });
}

export type UserIssueReportPayload = {
  uid: string;
  accountEmail: string | null;
  message: string;
  source: string;
  occurredAtISO: string;
  environment: {
    deviceType: "pc" | "mobile";
    browser: string;
    isWebView: boolean;
    webViewVendor: string | null;
    userAgent: string;
    language: string;
    platform: string;
    viewport: string;
  };
};

export async function saveUserIssueReport(payload: UserIssueReportPayload) {
  const reportRef = doc(collection(db, "errorReports"));
  await setDoc(reportRef, {
    reportType: "manual",
    uid: payload.uid,
    accountEmail: payload.accountEmail,
    message: payload.message,
    source: payload.source,
    occurredAtISO: payload.occurredAtISO,
    environment: payload.environment,
    createdAt: serverTimestamp(),
  });
}

export async function loadUserStatsWithFallback(uid: string): Promise<UserStats> {
  const userRef = doc(db, "users", uid);
  const metaRef = collection(db, "users", uid, "chapterMeta");
  const [userSnap, metaSnap] = await Promise.all([
    getDocFromServer(userRef).catch(() => getDoc(userRef)),
    getDocsFromServer(metaRef).catch(() => getDocs(metaRef)),
  ]);

  const userData = userSnap.data() as Partial<UserStats> | undefined;

  const rootStats: UserStats = {
    totalCompletedSentenceCount: userData?.totalCompletedSentenceCount ?? 0,
    totalNextCount: userData?.totalNextCount ?? 0,
    totalReplayCount: userData?.totalReplayCount ?? 0,
  };

  const metaTotals: UserStats = {
    totalCompletedSentenceCount: 0,
    totalNextCount: 0,
    totalReplayCount: 0,
  };

  metaSnap.forEach((docSnap) => {
    const data = docSnap.data() as ChapterMeta;
    metaTotals.totalCompletedSentenceCount += data.completedSentenceCount ?? 0;
    metaTotals.totalNextCount += data.nextCount ?? 0;
    metaTotals.totalReplayCount += data.replayCount ?? 0;
  });

  const mergedStats: UserStats = {
    totalCompletedSentenceCount: Math.max(
      rootStats.totalCompletedSentenceCount,
      metaTotals.totalCompletedSentenceCount
    ),
    totalNextCount: Math.max(rootStats.totalNextCount, metaTotals.totalNextCount),
    totalReplayCount: Math.max(rootStats.totalReplayCount, metaTotals.totalReplayCount),
  };

  const shouldHydrateRoot =
    mergedStats.totalCompletedSentenceCount > rootStats.totalCompletedSentenceCount ||
    mergedStats.totalNextCount > rootStats.totalNextCount ||
    mergedStats.totalReplayCount > rootStats.totalReplayCount;

  if (shouldHydrateRoot) {
    await setDoc(
      doc(db, "users", uid),
      {
        totalCompletedSentenceCount: mergedStats.totalCompletedSentenceCount,
        totalNextCount: mergedStats.totalNextCount,
        totalReplayCount: mergedStats.totalReplayCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return mergedStats;
}
