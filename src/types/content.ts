export type SentenceRow = {
    sentence: string;
    translation: string;
  };
  
  export type SheetContent = {
    name: string;
    rows: SentenceRow[];
  };
  