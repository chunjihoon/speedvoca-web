export type RecommendedContentMeta = {
  id: string;
  title: string;
  imageSrc: string;
  spreadsheetId: string;
  range: string;        // 예: "English Daily!A:B"
  language: string;     // 예: "en-US"
  access: "guest" | "login";
  sentenceCount: number;
};

const imageModules = import.meta.glob("../assets/recommendData/*.png", {
    eager: true,
    import: "default",
  }) as Record<string, string>;

function getImageByName(fileName: string): string {
const entry = Object.entries(imageModules).find(([path]) =>
    path.endsWith(fileName)
);
return entry ? entry[1] : "";
}

export const recommendedContentMetas: RecommendedContentMeta[] = [
  {
    id: "eng-daily",
    title: "English Daily Conversation",
    imageSrc: getImageByName("RecommImg-eng-daily.png"),
    spreadsheetId: "1LNjGD-nXoDsyhyMwxYlDWCn9Y6_i4PaGfyzOZCcKnO4",
    range: "eng-daily!A:B",
    language: "en-US",
    access: "guest",
    sentenceCount: 30
  },
  {
    id: "eng-travel",
    title: "English Travel Conversation",
    imageSrc: getImageByName("RecommImg-eng-travel.png"),
    spreadsheetId: "1LNjGD-nXoDsyhyMwxYlDWCn9Y6_i4PaGfyzOZCcKnO4",
    range: "eng-travel!A:B",
    language: "en-US",
    access: "guest",
    sentenceCount: 30
  },
  {
    id: "eng-work",
    title: "English Work Conversation",
    imageSrc: getImageByName("RecommImg-eng-work.png"),
    spreadsheetId: "1LNjGD-nXoDsyhyMwxYlDWCn9Y6_i4PaGfyzOZCcKnO4",
    range: "eng-work!A:B",
    language: "en-US",
    access: "guest",
    sentenceCount: 30
  },
];