// ─── Shared constants & utilities ────────────────────────────────────────────

/** First names used by the AllocationScene queue when real data runs out. */
export const FIRST = [
  "Kavindi","Pasindu","Nethmi","Ravindu","Dilani","Thilina","Amali","Buddhika",
  "Chathurika","Dasun","Eranga","Fathima","Geeth","Hasini","Isuru","Janani",
  "Kasun","Lahiru","Malsha","Nuwan","Oshadi","Pranith","Ruwini","Sandali",
  "Thashmika","Umindu","Vinura","Wanisha","Yohan","Zeenath",
];

/** Last names used by the AllocationScene queue when real data runs out. */
export const LAST = [
  "Wickramasinghe","Fernando","Perera","Senanayake","Rathnayake","Jayasinghe",
  "Silva","Dissanayake","Bandara","Gunawardena","Rodrigo","Mendis","Pathirana",
  "Amarasinghe","Liyanage","Samaraweera","Weerasinghe","Herath","Tennakoon",
];

/** Random name pool for the LiveRegistrationsScene joiner toasts. */
export const REG_NAMES = [
  "Amaya P.","Kasun J.","Nethmi S.","Ravindu W.","Sanduni F.","Tharindu D.",
  "Ishara M.","Dilini R.","Aisha K.","Liam O.","Sofia R.","Noah B.",
  "Priya N.","Yuki T.","Mateo G.","Zara H.","Ethan C.","Hana L.",
  "Omar A.","Chloe D.","Sahan G.","Nimesha K.","Arjun V.","Maya S.",
  "Leo F.","Ines M.",
];

export const REG_SUBS = ["just registered","joined the cohort","signed up","is in!"];

export const MILESTONE_STEP = 10;

/** Odometer reel track length (digits 0-9 × 3). */
export const REEL_TRACK_LEN = 30;

/** Pick a random element from an array. */
export function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
