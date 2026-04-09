export type AppLanguage = "ko" | "en";

export const APP_LANGUAGE_STORAGE_KEY = "speedvoca_app_language";
export const FAVORITES_SHEET_NAME = "Favorites";

type UiText = {
  app: {
    logoAlt: string;
    unknownError: string;
    loading: string;
    settingsAria: string;
    userFallbackName: string;
  };
  common: {
    close: string;
    cancel: string;
    exit: string;
    back: string;
    on: string;
    off: string;
    yes: string;
    no: string;
    favoritesLabel: string;
  };
  level: {
    short: string;
    xp: string;
    levelUp: string;
  };
  settings: {
    title: string;
    soundOn: string;
    soundOff: string;
    repeat: string;
    studyStats: string;
    studyStatsDescription: string;
    next: string;
    replay: string;
    language: string;
    korean: string;
    english: string;
    developer: string;
    developerMode: string;
    levelEffectTest: string;
    logout: string;
    loginGoogle: string;
    logoutConfirmTitle: string;
    logoutConfirmDescription: string;
  };
  loginPrompt: {
    requiredTitle: string;
    requiredDescription: string;
    continueWithGoogle: string;
    googleOnlyFootnote: string;
    quickLoginTitle: string;
    quickLoginDescription: string;
    moreSamplesTitle: string;
    moreSamplesDescription: string;
    importTitle: string;
    importDescription: string;
    manualSaveTitle: string;
    manualSaveDescription: string;
    deleteTitle: string;
    deleteDescription: string;
    readerFeatureTitle: string;
    readerFeatureDescription: string;
  };
  home: {
    myLearningSetsTitle: string;
    myLearningSetsDescription: string;
    recommendedTitle: string;
    recommendedDescription: string;
    importTitle: string;
    importDescription: string;
    loadingCard: string;
    recommendedLoadFailed: string;
  };
  sheet: {
    deleteChapterAria: string;
    sentences: string;
    guest: string;
    next: string;
    replay: string;
  };
  manualImport: {
    chapterTitle: string;
    chapterTitlePlaceholder: string;
    studyContent: string;
    studyContentPlaceholder: string;
    language: string;
    inputRules: string;
    ruleOneLine: string;
    ruleFormat: string;
    ruleExample: string;
    saveChapter: string;
    savingChapter: string;
    clear: string;
    suboption: string;
    importExcel: string;
  };
  alerts: {
    manualTitleRequired: string;
    manualContentRequired: string;
    manualEmptyRows: string;
    manualSaveFailed: string;
    manualSaved: (title: string, count: number) => string;
    deleteFavoritesForbidden: string;
    deleteDefaultForbidden: string;
    deleteConfirm: (title: string) => string;
    importNoSheets: string;
    importFailed: string;
    importDone: (count: number) => string;
    parseFormatLineError: (line: number) => string;
    parseMissingValueLineError: (line: number) => string;
  };
  reader: {
    emptySentence: string;
    exitTitle: string;
    exitDescription: string;
    randomOn: string;
    randomOff: string;
    backAria: string;
    favoriteAria: string;
    goPriorAria: string;
    goNextAria: string;
    replayAria: string;
    forceNextAria: string;
    languageName: Record<"en" | "zh" | "fr" | "ja" | "ko", string>;
  };
  recommendedTitles: Record<string, string>;
};

export const UI_TEXT: Record<AppLanguage, UiText> = {
  ko: {
    app: {
      logoAlt: "Loopeak Language Training Web",
      unknownError: "알 수 없는 오류",
      loading: "로딩 중...",
      settingsAria: "설정 열기",
      userFallbackName: "사용자",
    },
    common: {
      close: "닫기",
      cancel: "취소",
      exit: "종료",
      back: "뒤로",
      on: "켜짐",
      off: "꺼짐",
      yes: "예",
      no: "아니오",
      favoritesLabel: "즐겨찾기",
    },
    level: {
      short: "Lv.",
      xp: "경험치",
      levelUp: "LEVEL UP!",
    },
    settings: {
      title: "설정",
      soundOn: "🔊 성우 켜짐",
      soundOff: "🔇 성우 꺼짐",
      repeat: "문장당 반복 횟수",
      studyStats: "학습 통계",
      studyStatsDescription: "학습 중 버튼을 누른 누적 횟수입니다.",
      next: "Next",
      replay: "Replay",
      language: "UI 표기 언어",
      korean: "한국어",
      english: "English",
      developer: "개발자",
      developerMode: "개발자 모드",
      levelEffectTest: "레벨업 이펙트 테스트",
      logout: "로그아웃",
      loginGoogle: "Google 로그인",
      logoutConfirmTitle: "정말 로그아웃하시겠습니까?",
      logoutConfirmDescription: "현재 계정에서 로그아웃됩니다.",
    },
    loginPrompt: {
      requiredTitle: "로그인이 필요합니다",
      requiredDescription: "이 기능은 로그인 후 사용할 수 있습니다.",
      continueWithGoogle: "Google로 계속하기",
      googleOnlyFootnote: "현재는 Google 소셜 로그인만 지원합니다.",
      quickLoginTitle: "로그인",
      quickLoginDescription: "Google 계정으로 바로 시작할 수 있습니다.",
      moreSamplesTitle: "로그인 후 더 많은 자료를 학습할 수 있습니다",
      moreSamplesDescription:
        "지금은 첫 번째 샘플만 체험할 수 있습니다. 로그인하면 나머지 자료를 사용할 수 있습니다.",
      importTitle: "학습 자료를 가져오려면 로그인하세요",
      importDescription: "엑셀 파일을 가져오고 저장하려면 먼저 로그인해야 합니다.",
      manualSaveTitle: "학습 자료를 저장하려면 로그인하세요",
      manualSaveDescription: "직접 입력한 학습 자료를 저장하고 계속 사용하려면 로그인해야 합니다.",
      deleteTitle: "챕터 삭제는 로그인 후 사용 가능합니다",
      deleteDescription: "내 학습 세트에서 챕터를 삭제하려면 로그인하세요.",
      readerFeatureTitle: "로그인이 필요한 기능입니다",
      readerFeatureDescription:
        "즐겨찾기, 랜덤, 글자 크기 저장 같은 개인화 기능은 로그인 후 사용할 수 있습니다.",
    },
    home: {
      myLearningSetsTitle: "내 학습 세트",
      myLearningSetsDescription: "당신이 추가하거나 학습 중인 챕터입니다.",
      recommendedTitle: "추천 학습 세트",
      recommendedDescription:
        "기본 제공 학습 자료입니다. 로그인하면 원하는 세트를 내 학습 목록에 추가할 수 있습니다.",
      importTitle: "내 학습 자료 가져오기",
      importDescription:
        "문장과 해석을 직접 입력해서 나만의 학습 챕터를 만들 수 있습니다. 각 줄은 sentence | translation 형식으로 입력하세요.",
      loadingCard: "불러오는 중...",
      recommendedLoadFailed: "학습 자료를 불러오지 못했습니다.",
    },
    sheet: {
      deleteChapterAria: "챕터 삭제",
      sentences: "문장",
      guest: "게스트",
      next: "다음",
      replay: "리플레이",
    },
    manualImport: {
      chapterTitle: "챕터 제목",
      chapterTitlePlaceholder: "예: 일상 회화 연습",
      studyContent: "학습 내용",
      studyContentPlaceholder:
        "How are you? | 잘 지내?\nI’m on my way. | 가는 중이야\nLet’s get started. | 시작하자",
      language: "언어",
      inputRules: "입력 규칙",
      ruleOneLine: "한 줄 = 한 문장",
      ruleFormat: "형식: sentence | translation",
      ruleExample: "예: I’m exhausted. | 나 너무 지쳤어.",
      saveChapter: "챕터 저장",
      savingChapter: "저장 중...",
      clear: "지우기",
      suboption:
        "나만의 문장 자료를 엑셀 파일로 불러와서 공부해보세요. (형식: 1열-sentence, 2열-translation)",
      importExcel: "엑셀 파일 가져오기",
    },
    alerts: {
      manualTitleRequired: "챕터 제목을 입력하세요.",
      manualContentRequired: '학습 내용을 입력하세요. 각 줄은 "sentence | translation" 형식이어야 합니다.',
      manualEmptyRows: "저장할 문장이 없습니다.",
      manualSaveFailed: "입력한 학습 자료를 저장하는 중 오류가 발생했습니다.",
      manualSaved: (title, count) => `"${title}" 챕터가 추가되었습니다. (${count}문장)`,
      deleteFavoritesForbidden: "즐겨찾기 챕터는 삭제할 수 없습니다.",
      deleteDefaultForbidden:
        "기본 제공 챕터는 아직 삭제 대상이 아닙니다. 현재는 import한 챕터만 삭제할 수 있습니다.",
      deleteConfirm: (title) => `"${title}" 챕터를 삭제하시겠습니까?`,
      importNoSheets: "가져올 수 있는 시트가 없습니다. sentence / translation 형식을 확인하세요.",
      importFailed: "엑셀 import 중 오류가 발생했습니다.",
      importDone: (count) => `${count}개 챕터를 가져왔습니다.`,
      parseFormatLineError: (line) =>
        `${line}번째 줄 형식이 올바르지 않습니다. "sentence | translation" 형식으로 입력하세요.`,
      parseMissingValueLineError: (line) =>
        `${line}번째 줄에 sentence 또는 translation이 비어 있습니다.`,
    },
    reader: {
      emptySentence: "학습할 문장이 없습니다.",
      exitTitle: "학습을 종료하시겠습니까?",
      exitDescription: "지금 나가면 현재 학습 화면이 종료됩니다.",
      randomOn: "켜짐",
      randomOff: "꺼짐",
      backAria: "뒤로 가기",
      favoriteAria: "즐겨찾기 토글",
      goPriorAria: "이전으로",
      goNextAria: "다음으로",
      replayAria: "리플레이",
      forceNextAria: "강제로 다음",
      languageName: {
        en: "영어",
        zh: "중국어",
        fr: "프랑스어",
        ja: "일본어",
        ko: "한국어",
      },
    },
    recommendedTitles: {
      "daily-en": "영어 일상 회화",
      "daily-zh": "중국어 일상 회화",
      "daily-fr": "프랑스어 일상 회화",
      "daily-ko": "한국어 일상 회화",
      "travel-en": "영어 여행 표현",
      "travel-zh": "중국어 여행 표현",
      "travel-fr": "프랑스어 여행 표현",
      "travel-ko": "한국어 여행 표현",
      "work-en": "영어 업무 표현",
      "work-zh": "중국어 업무 표현",
      "work-fr": "프랑스어 업무 표현",
      "work-ko": "한국어 업무 표현",
    },
  },
  en: {
    app: {
      logoAlt: "Loopeak Language Training Web",
      unknownError: "Unknown error",
      loading: "Loading...",
      settingsAria: "Open settings",
      userFallbackName: "User",
    },
    common: {
      close: "Close",
      cancel: "Cancel",
      exit: "Exit",
      back: "Back",
      on: "On",
      off: "Off",
      yes: "Yes",
      no: "No",
      favoritesLabel: "Favorites",
    },
    level: {
      short: "Lv.",
      xp: "XP",
      levelUp: "LEVEL UP!",
    },
    settings: {
      title: "Settings",
      soundOn: "🔊 Voice On",
      soundOff: "🔇 Voice Off",
      repeat: "Repeat count",
      studyStats: "Study Stats",
      studyStatsDescription: "These are cumulative counts of your button taps during study.",
      next: "Next",
      replay: "Replay",
      language: "UI Language",
      korean: "Korean",
      english: "English",
      developer: "Developer",
      developerMode: "Developer Mode",
      levelEffectTest: "Test Level-Up Effect",
      logout: "Logout",
      loginGoogle: "Google Login",
      logoutConfirmTitle: "Do you really want to log out?",
      logoutConfirmDescription: "You will be logged out of the current account.",
    },
    loginPrompt: {
      requiredTitle: "Login Required",
      requiredDescription: "This feature is available after login.",
      continueWithGoogle: "Continue with Google",
      googleOnlyFootnote: "Currently, only Google social login is supported.",
      quickLoginTitle: "Login",
      quickLoginDescription: "Start right away with your Google account.",
      moreSamplesTitle: "Login to access more contents",
      moreSamplesDescription:
        "Right now, only the first content is available. Login to unlock the rest.",
      importTitle: "Login to import study material",
      importDescription: "You need to login first to import and save Excel files.",
      manualSaveTitle: "Login to save study material",
      manualSaveDescription:
        "You need to login to save manually entered study material and keep using it.",
      deleteTitle: "Login required to delete chapters",
      deleteDescription: "Login to delete chapters from your learning sets.",
      readerFeatureTitle: "Login required",
      readerFeatureDescription:
        "Personalized features such as favorites, random mode, and font size saving are available after login.",
    },
    home: {
      myLearningSetsTitle: "My Learning Sets",
      myLearningSetsDescription: "Chapters you added or are currently learning.",
      recommendedTitle: "Recommended Learning Sets",
      recommendedDescription:
        "These are built-in study materials. Login to add the sets you want to your own list.",
      importTitle: "Import Your Own Study Material",
      importDescription:
        "Create your own study chapter by entering sentence and translation pairs. Each line should follow the sentence | translation format.",
      loadingCard: "Loading...",
      recommendedLoadFailed: "Failed to load study material.",
    },
    sheet: {
      deleteChapterAria: "Delete chapter",
      sentences: "sentences",
      guest: "Guest",
      next: "Next",
      replay: "Replay",
    },
    manualImport: {
      chapterTitle: "Chapter Title",
      chapterTitlePlaceholder: "e.g. Daily Conversation Practice",
      studyContent: "Study Content",
      studyContentPlaceholder:
        "How are you? | How are you?\nI’m on my way. | I’m on my way.\nLet’s get started. | Let’s get started.",
      language: "Language",
      inputRules: "Input Rules",
      ruleOneLine: "One line = one sentence",
      ruleFormat: "Format: sentence | translation",
      ruleExample: "Example: I’m exhausted. | I’m really tired.",
      saveChapter: "Save Chapter",
      savingChapter: "Saving...",
      clear: "Clear",
      suboption:
        "You can also import your own sentences from an Excel file. (Format: column 1-sentence, column 2-translation)",
      importExcel: "Import Excel File",
    },
    alerts: {
      manualTitleRequired: "Please enter a chapter title.",
      manualContentRequired:
        'Please enter study content. Each line should follow "sentence | translation".',
      manualEmptyRows: "There are no sentences to save.",
      manualSaveFailed: "An error occurred while saving your study material.",
      manualSaved: (title, count) => `Added "${title}" chapter. (${count} sentences)`,
      deleteFavoritesForbidden: "Favorites chapter cannot be deleted.",
      deleteDefaultForbidden:
        "Built-in chapters cannot be deleted yet. Currently, only imported chapters can be deleted.",
      deleteConfirm: (title) => `Delete the "${title}" chapter?`,
      importNoSheets:
        "No importable sheets were found. Please check the sentence / translation format.",
      importFailed: "An error occurred while importing Excel.",
      importDone: (count) => `Imported ${count} chapter(s).`,
      parseFormatLineError: (line) =>
        `Line ${line} is invalid. Please use the "sentence | translation" format.`,
      parseMissingValueLineError: (line) =>
        `Line ${line} has an empty sentence or translation value.`,
    },
    reader: {
      emptySentence: "There are no sentences to study.",
      exitTitle: "Do you want to end this study session?",
      exitDescription: "If you leave now, the current study screen will close.",
      randomOn: "On",
      randomOff: "Off",
      backAria: "Back",
      favoriteAria: "Toggle favorite",
      goPriorAria: "Go prior",
      goNextAria: "Go next",
      replayAria: "Replay",
      forceNextAria: "Force next",
      languageName: {
        en: "English",
        zh: "Chinese",
        fr: "French",
        ja: "Japanese",
        ko: "Korean",
      },
    },
    recommendedTitles: {
      "daily-en": "English Daily Conversation",
      "daily-zh": "Chinese Daily Conversation",
      "daily-fr": "French Daily Conversation",
      "daily-ko": "Korean Daily Conversation",
      "travel-en": "English Travel Expressions",
      "travel-zh": "Chinese Travel Expressions",
      "travel-fr": "French Travel Expressions",
      "travel-ko": "Korean Travel Expressions",
      "work-en": "English Work Expressions",
      "work-zh": "Chinese Work Expressions",
      "work-fr": "French Work Expressions",
      "work-ko": "Korean Work Expressions",
    },
  },
};

export type AppUiText = UiText;
