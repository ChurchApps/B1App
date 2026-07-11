// Daily verse comes from /public/votd/verses.json — a vendored copy of the VotdContent
// catalog (github.com/ChurchApps/VotdContent, served at votd.org), which has no CORS
// header for direct browser fetch. Same day-of-year indexing as the votd.org imagery.
export interface DailyVerse {
  text: string;
  reference: string;
}

interface CatalogVerse extends DailyVerse {
  day: number;
}

const FALLBACK: DailyVerse[] = [
  { text: "In the beginning, God created the heavens and the earth.", reference: "Genesis 1:1" },
  { text: "The Lord is my shepherd; I shall lack nothing.", reference: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart, and don't lean on your own understanding.", reference: "Proverbs 3:5" },
  { text: "Your word is a lamp to my feet, and a light for my path.", reference: "Psalm 119:105" },
  { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { text: "This is the day that the Lord has made. We will rejoice and be glad in it!", reference: "Psalm 118:24" },
  { text: "Come to me, all you who labor and are heavily burdened, and I will give you rest.", reference: "Matthew 11:28" }
];

let catalog: CatalogVerse[] | null = null;

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

export const loadDailyVerse = async (date: Date = new Date()): Promise<DailyVerse> => {
  const day = getDayOfYear(date);
  if (!catalog) {
    try {
      const res = await fetch("/votd/verses.json");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.verses) && data.verses.length > 0) catalog = data.verses;
      }
    } catch {
      // offline or fetch failure — fall through to the local list
    }
  }
  const match = catalog?.find((v) => v.day === day);
  if (match) return { text: match.text, reference: match.reference };
  return FALLBACK[day % FALLBACK.length];
};
