/**
 * Mentee seed data (83 mentees) — 10th batch, TG/IT/2025/XXXX
 * Each mentee has 3 ranked mentor preferences drawn from the real 43-mentor list.
 * Inject order: Mentors → Mentees → Preferences
 */

export type SeedMentee = {
  fullName: string;
  last4: string;
  phone: string;
  /** Mentor last4 in priority order [1st, 2nd, 3rd] — all unique */
  prefs: [string, string, string];
};

export const MENTEE_PREFIX = "TG/IT/2025/";

export function menteeStudentId(last4: string): string {
  return `${MENTEE_PREFIX}${last4.padStart(4, "0")}`;
}

// Real mentor last4 list (43 mentors, in seed order)
const MENTORS = [
  "2061","2063","2064","2066","2067","2069","2071","2073","2074","2075",
  "2077","2078","2079","2080","2083","2084","2085","2086","2087","2089",
  "2090","2091","2092","2095","2097","2100","2106","2109","2110","2111",
  "2114","2115","2117","2121","2123","2125","2126","2128","2131","2139",
  "2143","2144","2147",
] as const;

const N = MENTORS.length; // 43

/** Pick mentor at 0-based index, wrapping around */
function m(i: number): string { return MENTORS[((i % N) + N) % N]; }

export const SEED_MENTEES: SeedMentee[] = [
  { fullName: "Kavindi Wickramasinghe",    last4: "0001", phone: "0710000001", prefs: [m(18),  m(35),  m(11) ] },
  { fullName: "Pasindu Fernando",          last4: "0002", phone: "0710000002", prefs: [m(41),  m(14),  m(35) ] },
  { fullName: "Nethmi Perera",             last4: "0003", phone: "0710000003", prefs: [m(11),  m(10),  m(38) ] },
  { fullName: "Ravindu Senanayake",        last4: "0004", phone: "0710000004", prefs: [m(19),  m(15),  m(36) ] },
  { fullName: "Dilani Rathnayake",         last4: "0005", phone: "0710000005", prefs: [m(42),  m(12),  m(34) ] },
  { fullName: "Thilina Jayasinghe",        last4: "0006", phone: "0710000006", prefs: [m(19),  m(36),  m(42) ] },
  { fullName: "Amali Kumari",              last4: "0007", phone: "0710000007", prefs: [m(9),  m(36),  m(17) ] },
  { fullName: "Buddhika Dissanayake",      last4: "0008", phone: "0710000008", prefs: [m(35),  m(40),  m(5) ] },
  { fullName: "Chathurika Silva",          last4: "0009", phone: "0710000009", prefs: [m(9),  m(15),  m(2) ] },
  { fullName: "Dasun Bandara",             last4: "0010", phone: "0710000010", prefs: [m(14),  m(17),  m(5) ] },
  { fullName: "Eranga Gunawardena",        last4: "0011", phone: "0710000011", prefs: [m(35),  m(36),  m(14) ] },
  { fullName: "Fathima Nazar",             last4: "0012", phone: "0710000012", prefs: [m(14),  m(8),  m(19) ] },
  { fullName: "Geeth Samaraweera",         last4: "0013", phone: "0710000013", prefs: [m(14),  m(8),  m(40) ] },
  { fullName: "Hasini Weerasinghe",        last4: "0014", phone: "0710000014", prefs: [m(10),  m(1),  m(11) ] },
  { fullName: "Isuru Liyanage",            last4: "0015", phone: "0710000015", prefs: [m(0),  m(40),  m(38) ] },
  { fullName: "Janani Rodrigo",            last4: "0016", phone: "0710000016", prefs: [m(14),  m(42),  m(36) ] },
  { fullName: "Kasun Jayawardena",         last4: "0017", phone: "0710000017", prefs: [m(16),  m(5),  m(40) ] },
  { fullName: "Lahiru Mendis",             last4: "0018", phone: "0710000018", prefs: [m(26),  m(10),  m(42) ] },
  { fullName: "Malsha Pathirana",          last4: "0019", phone: "0710000019", prefs: [m(14),  m(8),  m(20) ] },
  { fullName: "Nuwan Amarasinghe",         last4: "0020", phone: "0710000020", prefs: [m(39),  m(5),  m(16) ] },
  { fullName: "Oshadi Tennakoon",          last4: "0021", phone: "0710000021", prefs: [m(14),  m(41),  m(42) ] },
  { fullName: "Pasindu Kodithuwakku",      last4: "0022", phone: "0710000022", prefs: [m(17),  m(8),  m(35) ] },
  { fullName: "Qasim Niyaz",               last4: "0023", phone: "0710000023", prefs: [m(40),  m(14),  m(8) ] },
  { fullName: "Ranindu Perumal",           last4: "0024", phone: "0710000024", prefs: [m(35),  m(5),  m(40) ] },
  { fullName: "Sachini Hapuarachchi",      last4: "0025", phone: "0710000025", prefs: [m(0),  m(8),  m(35) ] },
  { fullName: "Thilanka Nanayakkara",      last4: "0026", phone: "0710000026", prefs: [m(14),  m(4),  m(38) ] },
  { fullName: "Uthpala Madushanka",        last4: "0027", phone: "0710000027", prefs: [m(10),  m(19),  m(11) ] },
  { fullName: "Vimukthi Wijesekara",       last4: "0028", phone: "0710000028", prefs: [m(19),  m(15),  m(42) ] },
  { fullName: "Waruni Abeykoon",           last4: "0029", phone: "0710000029", prefs: [m(8),  m(4),  m(14) ] },
  { fullName: "Yasodha Kumarasinghe",      last4: "0030", phone: "0710000030", prefs: [m(5),  m(35),  m(11) ] },
  { fullName: "Zayan Farook",              last4: "0031", phone: "0710000031", prefs: [m(5),  m(11),  m(10) ] },
  { fullName: "Amasha Jayasekara",         last4: "0032", phone: "0710000032", prefs: [m(15),  m(19),  m(8) ] },
  { fullName: "Binuri Samarakoon",         last4: "0033", phone: "0710000033", prefs: [m(14),  m(35),  m(38) ] },
  { fullName: "Chamara Ranasinghe",        last4: "0034", phone: "0710000034", prefs: [m(23),  m(41),  m(19) ] },
  { fullName: "Dulani Herath",             last4: "0035", phone: "0710000035", prefs: [m(41),  m(33),  m(23) ] },
  { fullName: "Eranda Priyankara",         last4: "0036", phone: "0710000036", prefs: [m(5),  m(2),  m(8) ] },
  { fullName: "Gimhan Rajapaksha",         last4: "0037", phone: "0710000037", prefs: [m(38),  m(41),  m(19) ] },
  { fullName: "Hiruni Attanayake",         last4: "0038", phone: "0710000038", prefs: [m(5),  m(19),  m(11) ] },
  { fullName: "Ishan Wickramaratne",       last4: "0039", phone: "0710000039", prefs: [m(24),  m(35),  m(5) ] },
  { fullName: "Janitha Madusanka",         last4: "0040", phone: "0710000040", prefs: [m(5),  m(8),  m(41) ] },
  { fullName: "Kalani Edirisinghe",        last4: "0041", phone: "0710000041", prefs: [m(20),  m(42),  m(27) ] },
  { fullName: "Lakshan Thisera",           last4: "0042", phone: "0710000042", prefs: [m(25),  m(19),  m(22) ] },
  { fullName: "Minuli Jayasundara",        last4: "0043", phone: "0710000043", prefs: [m(14),  m(5),  m(0) ] },
  { fullName: "Nadun Madurapperuma",       last4: "0044", phone: "0710000044", prefs: [m(3),  m(30),  m(28) ] },
  { fullName: "Oneli Ganegama",            last4: "0045", phone: "0710000045", prefs: [m(28),  m(9),  m(10) ] },
  { fullName: "Pranith Karunaratne",       last4: "0046", phone: "0710000046", prefs: [m(8),  m(10),  m(14) ] },
  { fullName: "Ruwini Ambagamuwa",         last4: "0047", phone: "0710000047", prefs: [m(35),  m(24),  m(39) ] },
  { fullName: "Sandali Wijekoon",          last4: "0048", phone: "0710000048", prefs: [m(38),  m(9),  m(22) ] },
  { fullName: "Thashmika Pemasiri",        last4: "0049", phone: "0710000049", prefs: [m(16),  m(15),  m(35) ] },
  { fullName: "Umindu Jayalath",           last4: "0050", phone: "0710000050", prefs: [m(40),  m(6),  m(15) ] },
  { fullName: "Vinura Alagiyawanna",       last4: "0051", phone: "0710000051", prefs: [m(36),  m(14),  m(35) ] },
  { fullName: "Wanisha Weerakoon",         last4: "0052", phone: "0710000052", prefs: [m(5),  m(35),  m(38) ] },
  { fullName: "Yohan Siriwardena",         last4: "0053", phone: "0710000053", prefs: [m(36),  m(15),  m(42) ] },
  { fullName: "Zeenath Ifthikar",          last4: "0054", phone: "0710000054", prefs: [m(9),  m(18),  m(19) ] },
  { fullName: "Ashen Maduranga",           last4: "0055", phone: "0710000055", prefs: [m(38),  m(15),  m(0) ] },
  { fullName: "Bimendra Rajapakshe",       last4: "0056", phone: "0710000056", prefs: [m(14),  m(42),  m(41) ] },
  { fullName: "Chathura Madushan",         last4: "0057", phone: "0710000057", prefs: [m(11),  m(35),  m(8) ] },
  { fullName: "Dinuka Liyanaarachchi",     last4: "0058", phone: "0710000058", prefs: [m(42),  m(37),  m(38) ] },
  { fullName: "Erandika Samarathunga",     last4: "0059", phone: "0710000059", prefs: [m(4),  m(40),  m(8) ] },
  { fullName: "Gayan Pushpakumara",        last4: "0060", phone: "0710000060", prefs: [m(40),  m(12),  m(41) ] },
  { fullName: "Hansika Wimalasiri",        last4: "0061", phone: "0710000061", prefs: [m(19),  m(14),  m(18) ] },
  { fullName: "Ireshki Dissanayaka",       last4: "0062", phone: "0710000062", prefs: [m(16),  m(19),  m(12) ] },
  { fullName: "Janith Malshan",            last4: "0063", phone: "0710000063", prefs: [m(0),  m(6),  m(15) ] },
  { fullName: "Kalani Thisera",            last4: "0064", phone: "0710000064", prefs: [m(29),  m(8),  m(35) ] },
  { fullName: "Lakshan Udagedara",         last4: "0065", phone: "0710000065", prefs: [m(2),  m(16),  m(0) ] },
  { fullName: "Minuli Karunanayake",       last4: "0066", phone: "0710000066", prefs: [m(41),  m(40),  m(9) ] },
  { fullName: "Nadun Gunathilake",         last4: "0067", phone: "0710000067", prefs: [m(14),  m(40),  m(5) ] },
  { fullName: "Oneli Kahatapitiya",        last4: "0068", phone: "0710000068", prefs: [m(22),  m(5),  m(8) ] },
  { fullName: "Pranith Wickramaratne",     last4: "0069", phone: "0710000069", prefs: [m(25),  m(35),  m(15) ] },
  { fullName: "Ruwini Dahanayake",         last4: "0070", phone: "0710000070", prefs: [m(6),  m(10),  m(0) ] },
  { fullName: "Sandali Rathnasiri",        last4: "0071", phone: "0710000071", prefs: [m(5),  m(16),  m(28) ] },
  { fullName: "Thashmika Sooriyaarachchi", last4: "0072", phone: "0710000072", prefs: [m(16),  m(37),  m(38) ] },
  { fullName: "Umindu Mohomed",            last4: "0073", phone: "0710000073", prefs: [m(41),  m(19),  m(35) ] },
  { fullName: "Vinura Jayalath",           last4: "0074", phone: "0710000074", prefs: [m(41),  m(11),  m(14) ] },
  { fullName: "Wanisha Pemasiri",          last4: "0075", phone: "0710000075", prefs: [m(29),  m(15),  m(36) ] },
  { fullName: "Yohan Ambagamuwa",          last4: "0076", phone: "0710000076", prefs: [m(14),  m(20),  m(10) ] },
  { fullName: "Zeenath Alagiyawanna",      last4: "0077", phone: "0710000077", prefs: [m(36),  m(14),  m(16) ] },
  { fullName: "Ashen Samarakoon",          last4: "0078", phone: "0710000078", prefs: [m(17),  m(14),  m(42) ] },
  { fullName: "Binara Senanayaka",         last4: "0079", phone: "0710000079", prefs: [m(35),  m(8),  m(26) ] },
  { fullName: "Chamini Dahanayake",        last4: "0080", phone: "0710000080", prefs: [m(2),  m(15),  m(33) ] },
  { fullName: "Dumindu Rathnasiri",        last4: "0081", phone: "0710000081", prefs: [m(11),  m(19),  m(35) ] },
  { fullName: "Eshani Sooriyaarachchi",    last4: "0082", phone: "0710000082", prefs: [m(11),  m(20),  m(41) ] },
  { fullName: "Firas Mohomed",             last4: "0083", phone: "0710000083", prefs: [m(36),  m(19),  m(15) ] },
];