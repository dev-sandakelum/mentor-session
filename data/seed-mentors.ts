/**
 * Mentor seed data (45 mentors) — 9th batch, TG/2024/XXXX
 * Inject via "Inject Mentors" in the super-admin panel.
 * All injected as is_approved = true.
 */

export type SeedMentor = {
  fullName: string;
  last4: string;
  email: string;
  phone: string;
  communicationMethod: "WhatsApp" | "Email" | "Phone Call" | "In-Person";
  capacity: number;
};

export const MENTOR_PREFIX = "TG/2024/";
export const MENTOR_BATCH  = "9th";

export function mentorStudentId(last4: string): string {
  return `${MENTOR_PREFIX}${last4.padStart(4, "0")}`;
}

export const SEED_MENTORS: SeedMentor[] = [
  { fullName: "Ashan Perera",           last4: "0001", email: "tg2024001@fot.ruh.ac.lk", phone: "0771000001", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Binura Jayasinghe",       last4: "0002", email: "tg2024002@fot.ruh.ac.lk", phone: "0771000002", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Chamodi Silva",           last4: "0003", email: "tg2024003@fot.ruh.ac.lk", phone: "0771000003", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Dasun Fernando",          last4: "0004", email: "tg2024004@fot.ruh.ac.lk", phone: "0771000004", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Erandi Wickramasinghe",   last4: "0005", email: "tg2024005@fot.ruh.ac.lk", phone: "0771000005", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Fathima Rifqa",           last4: "0006", email: "tg2024006@fot.ruh.ac.lk", phone: "0771000006", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Geeth Bandara",           last4: "0007", email: "tg2024007@fot.ruh.ac.lk", phone: "0771000007", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Hasini Rathnayake",       last4: "0008", email: "tg2024008@fot.ruh.ac.lk", phone: "0771000008", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Isuru Madushanka",        last4: "0009", email: "tg2024009@fot.ruh.ac.lk", phone: "0771000009", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Janani Kumari",           last4: "0010", email: "tg2024010@fot.ruh.ac.lk", phone: "0771000010", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Kasun Dissanayake",       last4: "0011", email: "tg2024011@fot.ruh.ac.lk", phone: "0771000011", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Lahiru Gunawardena",      last4: "0012", email: "tg2024012@fot.ruh.ac.lk", phone: "0771000012", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Malsha Senanayake",       last4: "0013", email: "tg2024013@fot.ruh.ac.lk", phone: "0771000013", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Nuwan Priyantha",         last4: "0014", email: "tg2024014@fot.ruh.ac.lk", phone: "0771000014", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Oshadi Herath",           last4: "0015", email: "tg2024015@fot.ruh.ac.lk", phone: "0771000015", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Pasindu Rajapaksha",      last4: "0016", email: "tg2024016@fot.ruh.ac.lk", phone: "0771000016", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Qasim Nafeel",            last4: "0017", email: "tg2024017@fot.ruh.ac.lk", phone: "0771000017", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Ravindu Amarasinghe",     last4: "0018", email: "tg2024018@fot.ruh.ac.lk", phone: "0771000018", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Sachini Weerasinghe",     last4: "0019", email: "tg2024019@fot.ruh.ac.lk", phone: "0771000019", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Thilina Liyanage",        last4: "0020", email: "tg2024020@fot.ruh.ac.lk", phone: "0771000020", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Uthpala Mendis",          last4: "0021", email: "tg2024021@fot.ruh.ac.lk", phone: "0771000021", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Vimukthi Pathirana",      last4: "0022", email: "tg2024022@fot.ruh.ac.lk", phone: "0771000022", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Waruni Kodithuwakku",     last4: "0023", email: "tg2024023@fot.ruh.ac.lk", phone: "0771000023", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Xavier Perumal",          last4: "0024", email: "tg2024024@fot.ruh.ac.lk", phone: "0771000024", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Yasodha Tennakoon",       last4: "0025", email: "tg2024025@fot.ruh.ac.lk", phone: "0771000025", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Zayan Farook",            last4: "0026", email: "tg2024026@fot.ruh.ac.lk", phone: "0771000026", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Amali Rodrigo",           last4: "0027", email: "tg2024027@fot.ruh.ac.lk", phone: "0771000027", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Buddhika Samaraweera",    last4: "0028", email: "tg2024028@fot.ruh.ac.lk", phone: "0771000028", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Chathurani Jayawardena",  last4: "0029", email: "tg2024029@fot.ruh.ac.lk", phone: "0771000029", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Dilshan Wijesekara",      last4: "0030", email: "tg2024030@fot.ruh.ac.lk", phone: "0771000030", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Erangi Hapuarachchi",     last4: "0031", email: "tg2024031@fot.ruh.ac.lk", phone: "0771000031", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Gihan Kumarasinghe",      last4: "0032", email: "tg2024032@fot.ruh.ac.lk", phone: "0771000032", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Himasha Abeykoon",        last4: "0033", email: "tg2024033@fot.ruh.ac.lk", phone: "0771000033", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Ireshka Nanayakkara",     last4: "0034", email: "tg2024034@fot.ruh.ac.lk", phone: "0771000034", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Janith Madusanka",        last4: "0035", email: "tg2024035@fot.ruh.ac.lk", phone: "0771000035", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Kavisha Seneviratne",     last4: "0036", email: "tg2024036@fot.ruh.ac.lk", phone: "0771000036", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Lakindu Peiris",          last4: "0037", email: "tg2024037@fot.ruh.ac.lk", phone: "0771000037", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Malindi Gunasekara",      last4: "0038", email: "tg2024038@fot.ruh.ac.lk", phone: "0771000038", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Nadeeka Vithanage",       last4: "0039", email: "tg2024039@fot.ruh.ac.lk", phone: "0771000039", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Oshadhi Abeywickrama",    last4: "0040", email: "tg2024040@fot.ruh.ac.lk", phone: "0771000040", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Piyumi Karunarathna",     last4: "0041", email: "tg2024041@fot.ruh.ac.lk", phone: "0771000041", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Rasika Dassanayake",      last4: "0042", email: "tg2024042@fot.ruh.ac.lk", phone: "0771000042", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Sanduni Embuldeniya",     last4: "0043", email: "tg2024043@fot.ruh.ac.lk", phone: "0771000043", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Tharaka Udagedara",       last4: "0044", email: "tg2024044@fot.ruh.ac.lk", phone: "0771000044", communicationMethod: "WhatsApp", capacity: 2 },
  { fullName: "Uvindu Karunanayake",     last4: "0045", email: "tg2024045@fot.ruh.ac.lk", phone: "0771000045", communicationMethod: "WhatsApp", capacity: 2 },
];
