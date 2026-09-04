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
  email: string;
  phone: string;
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
  { fullName: "Chirath Miyuru",         last4: "2089", email: "tg20242089@fot.ruh.ac.lk", phone: "0770000001", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2089.jpeg` },
  { fullName: "Amjad Hassan",           last4: "2061", email: "tg20242061@fot.ruh.ac.lk", phone: "0770000002", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2061.jpeg` },
  { fullName: "Ruvisha Lakmina",        last4: "2064", email: "tg20242064@fot.ruh.ac.lk", phone: "0770000003", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2064.jpg`  },
  { fullName: "Dasindu Dilvan",         last4: "2067", email: "tg20242067@fot.ruh.ac.lk", phone: "0770000004", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2067.jpg`  },
  { fullName: "Thisaru Thiwanka",       last4: "2069", email: "tg20242069@fot.ruh.ac.lk", phone: "0770000005", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2069.jpg`  },
  { fullName: "Gihan Kavindu",          last4: "2071", email: "tg20242071@fot.ruh.ac.lk", phone: "0770000006", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2071.jpg`  },
  { fullName: "W. Hiruni Chethana",     last4: "2074", email: "tg20242074@fot.ruh.ac.lk", phone: "0770000007", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2074.jpeg` },
  { fullName: "M. L. Omethra Thisagi", last4: "2075", email: "tg20242075@fot.ruh.ac.lk", phone: "0770000008", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2075.jpg`  },
  { fullName: "Sudeshika Sandeepani",   last4: "2080", email: "tg20242080@fot.ruh.ac.lk", phone: "0770000009", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2080.jpg`  },
  { fullName: "Bineth Vindinu",         last4: "2083", email: "tg20242083@fot.ruh.ac.lk", phone: "0770000010", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2083.jpg`  },
  { fullName: "Kaveesh Bandara",        last4: "2084", email: "tg20242084@fot.ruh.ac.lk", phone: "0770000011", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2084.jpg`  },
  { fullName: "Dilush Bandara",         last4: "2085", email: "tg20242085@fot.ruh.ac.lk", phone: "0770000012", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2085.jpeg` },
  { fullName: "Minula Kudarachchi",     last4: "2086", email: "tg20242086@fot.ruh.ac.lk", phone: "0770000013", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2086.jpg`  },
  { fullName: "Nithila Kithnula",       last4: "2090", email: "tg20242090@fot.ruh.ac.lk", phone: "0770000014", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2090.png`  },
  { fullName: "Hansika Devindi",        last4: "2092", email: "tg20242092@fot.ruh.ac.lk", phone: "0770000015", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2092.jpeg` },
  { fullName: "Hasaranga KHM",          last4: "2095", email: "tg20242095@fot.ruh.ac.lk", phone: "0770000016", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2095.jpeg` },
  { fullName: "Nirmal Sasindu",         last4: "2097", email: "tg20242097@fot.ruh.ac.lk", phone: "0770000017", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2097.jpg`  },
  { fullName: "Dilmi Ishara",           last4: "2100", email: "tg20242100@fot.ruh.ac.lk", phone: "0770000018", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2100.jpeg` },
  { fullName: "Praveen Sandeepa",       last4: "2106", email: "tg20242106@fot.ruh.ac.lk", phone: "0770000019", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2106.jpg`  },
  { fullName: "Dilshan Madhusankha",    last4: "2109", email: "tg20242109@fot.ruh.ac.lk", phone: "0770000020", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2109.jpg`  },
  { fullName: "Tashiru Dissanayaka",    last4: "2110", email: "tg20242110@fot.ruh.ac.lk", phone: "0770000021", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2110.jpg`  },
  { fullName: "Hasindu Nethsara",       last4: "2111", email: "tg20242111@fot.ruh.ac.lk", phone: "0770000022", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2111.jpeg` },
  { fullName: "W. L. Bhashitha",        last4: "2115", email: "tg20242115@fot.ruh.ac.lk", phone: "0770000023", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2115.jpeg` },
  { fullName: "Wimukthi Weerasinghe",   last4: "2117", email: "tg20242117@fot.ruh.ac.lk", phone: "0770000024", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2117.jpeg` },
  { fullName: "Naveen Nethmal",         last4: "2121", email: "tg20242121@fot.ruh.ac.lk", phone: "0770000025", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2121.jpg`  },
  { fullName: "Chamindu Dilhara",       last4: "2126", email: "tg20242126@fot.ruh.ac.lk", phone: "0770000026", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2126.jpg`  },
  { fullName: "M. A. Aysha",            last4: "2128", email: "tg20242128@fot.ruh.ac.lk", phone: "0770000027", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2128.jpg`  },
  { fullName: "Sachin Shehan",          last4: "2131", email: "tg20242131@fot.ruh.ac.lk", phone: "0770000028", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2131.jpeg` },
  { fullName: "Chamod Kalhara",         last4: "2139", email: "tg20242139@fot.ruh.ac.lk", phone: "0770000029", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2139.jpg`  },
  { fullName: "Pasidu Prasad",          last4: "2143", email: "tg20242143@fot.ruh.ac.lk", phone: "0770000030", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2143.jpeg` },
  { fullName: "Isindu Anjana",          last4: "2144", email: "tg20242144@fot.ruh.ac.lk", phone: "0770000031", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2144.jpg`  },
  { fullName: "Nadula Ranathunga",      last4: "2147", email: "tg20242147@fot.ruh.ac.lk", phone: "0770000032", communicationMethod: "WhatsApp", capacity: 2, profilePhotoUrl: `${P}/2147.jpeg` },
];
