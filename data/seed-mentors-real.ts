/**
 * Real mentor seed data — sourced from Google Form responses (32 mentors).
 * Photos served from /public/profile/mentor/Renamed_Photos/
 *
 * To use: update the import in app/api/super/seed/route.ts:
 *   import { SEED_MENTORS, mentorStudentId, MENTOR_BATCH } from "@/data/seed-mentors-real";
 * then click "Inject Mentors" in the super-admin panel (/super).
 *
 * Emails/phones are placeholders — update before injecting if needed.
 * All injected as is_approved = true, capacity = 2.
 */

export type SeedMentor = {
  fullName: string;
  last4: string;
  email: string | null;
  phone: string | null;
  communicationMethod: "WhatsApp" | "Email" | "Phone Call" | "In-Person";
  capacity: number;
  profilePhotoUrl: string | null;
};

export const MENTOR_PREFIX = "TG/2024/";
export const MENTOR_BATCH  = "9th";

export function mentorStudentId(last4: string): string {
  return `${MENTOR_PREFIX}${last4}`;
}

const P = "/profile/mentor/Renamed_Photos";

export const SEED_MENTORS: SeedMentor[] = [
  { fullName: "Amjad Hassan",           last4: "2061", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2061.jpeg` },
  { fullName: "Ruvisha Lakmina",        last4: "2064", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2064.jpg`  },
  { fullName: "Dasindu Dilvan",         last4: "2067", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2067.jpg`  },
  { fullName: "Thisaru Thiwanka",       last4: "2069", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2069.jpg`  },
  { fullName: "Gihan Kavindu",          last4: "2071", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2071.jpg`  },
  { fullName: "W. Hiruni Chethana",     last4: "2074", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2074.jpeg` },
  { fullName: "M. L. Omethra Thisagi", last4: "2075", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2075.jpg`  },
  { fullName: "Nadeera Nethmina",       last4: "2078", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2078.jpeg` },
  { fullName: "Tharuka Perera",         last4: "2079", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2079.jpeg` },
  { fullName: "Sudeshika Sandeepani",   last4: "2080", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2080.jpg`  },
  { fullName: "Bineth Vindinu",         last4: "2083", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2083.jpg`  },
  { fullName: "Kaveesh Bandara",        last4: "2084", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2084.jpg`  },
  { fullName: "Dilush Bandara",         last4: "2085", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2085.jpeg` },
  { fullName: "Minula Kudarachchi",     last4: "2086", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2086.jpg`  },
  { fullName: "Vishwa Dasun",           last4: "2087", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2087.jpeg` },
  { fullName: "Chirath Miyuru",         last4: "2089", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2089.jpeg` },
  { fullName: "Nithila Kithnula",       last4: "2090", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2090.png`  },
  { fullName: "Vinuthi Abeywardana",    last4: "2091", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2091.jpg`  },
  { fullName: "Hansika Devindi",        last4: "2092", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2092.jpeg` },
  { fullName: "Hasaranga KHM",          last4: "2095", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2095.jpeg` },
  { fullName: "Nirmal Sasindu",         last4: "2097", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2097.jpg`  },
  { fullName: "Dilmi Ishara",           last4: "2100", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2100.jpeg` },
  { fullName: "Praveen Sandeepa",       last4: "2106", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2106.jpg`  },
  { fullName: "Dilshan Madhusankha",    last4: "2109", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2109.jpg`  },
  { fullName: "Tashiru Dissanayaka",    last4: "2110", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2110.jpg`  },
  { fullName: "Hasindu Nethsara",       last4: "2111", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2111.jpeg` },
  { fullName: "Sahan Buddhika",         last4: "2114", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2114.jpg`  },
  { fullName: "W. L. Bhashitha",        last4: "2115", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2115.jpeg` },
  { fullName: "Wimukthi Weerasinghe",   last4: "2117", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2117.jpeg` },
  { fullName: "Naveen Nethmal",         last4: "2121", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2121.jpg`  },
  { fullName: "Nirasha Weerawardhana",  last4: "2123", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2123.jpg`  },
  { fullName: "Abhisheka Sankalpani",   last4: "2125", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2125.jpg`  },
  { fullName: "Chamindu Dilhara",       last4: "2126", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2126.jpg`  },
  { fullName: "M. A. Aysha",            last4: "2128", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2128.jpg`  },
  { fullName: "Sachin Shehan",          last4: "2131", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2131.jpeg` },
  { fullName: "Chamod Kalhara",         last4: "2139", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2139.jpg`  },
  { fullName: "Pasidu Prasad",          last4: "2143", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2143.jpeg` },
  { fullName: "Isindu Anjana",          last4: "2144", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2144.jpg`  },
  { fullName: "Nadula Ranathunga",      last4: "2147", email: null, phone: null, communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2147.jpeg` },
];
