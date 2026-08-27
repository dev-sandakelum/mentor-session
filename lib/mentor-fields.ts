import { ApiError, stringField } from "@/lib/api";

export const COMMUNICATION_METHODS = ["WhatsApp", "Email", "Phone Call", "In-Person"] as const;

export type ParsedMentorFields = {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  batch: string;
  communicationMethod: string;
  profilePhotoUrl: string | null;
  capacity: number;
};

export function parseMentorFields(body: Record<string, unknown>, options?: { requireAll?: boolean }): ParsedMentorFields {
  const requireAll = options?.requireAll ?? false;
  const fullName = requireAll
    ? stringField(body.fullName, "Full name", { max: 120 })
    : stringField(body.fullName, "Full name", { optional: true, max: 120 });
  const studentId = requireAll
    ? stringField(body.studentId, "Student ID", { max: 50 })
    : stringField(body.studentId, "Student ID", { optional: true, max: 50 });
  const email = requireAll
    ? stringField(body.email, "University email", { max: 254 })
    : stringField(body.email, "University email", { optional: true, max: 254 });
  const phone = requireAll
    ? stringField(body.phone, "Contact number", { max: 30 })
    : stringField(body.phone, "Contact number", { optional: true, max: 30 });
  const batch = requireAll
    ? stringField(body.batch, "Batch", { max: 50 })
    : stringField(body.batch, "Batch", { optional: true, max: 50 });
  const communicationMethod = requireAll
    ? stringField(body.communicationMethod, "Preferred communication method", { max: 40 })
    : stringField(body.communicationMethod, "Preferred communication method", { optional: true, max: 40 });
  const profilePhotoUrl = stringField(body.profilePhotoUrl, "Profile photo URL", { optional: true, max: 2048 });

  if (requireAll) {
    if (!fullName || !studentId || !email || !phone || !batch || !communicationMethod) {
      throw new ApiError("All required mentor fields must be provided.");
    }
    if (phone.replace(/\D/g, "").length < 7) throw new ApiError("Enter a valid contact number.", 400, "phone");
    if (!COMMUNICATION_METHODS.includes(communicationMethod as (typeof COMMUNICATION_METHODS)[number])) {
      throw new ApiError("Choose a valid communication method.", 400, "communicationMethod");
    }
  } else if (phone && phone.replace(/\D/g, "").length < 7) {
    throw new ApiError("Enter a valid contact number.", 400, "phone");
  } else if (communicationMethod && !COMMUNICATION_METHODS.includes(communicationMethod as (typeof COMMUNICATION_METHODS)[number])) {
    throw new ApiError("Choose a valid communication method.", 400, "communicationMethod");
  }

  if (profilePhotoUrl) {
    try {
      const url = new URL(profilePhotoUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    } catch {
      throw new ApiError("Enter a valid http(s) profile photo URL.", 400, "profilePhotoUrl");
    }
  }

  const capacity = body.capacity;
  let parsedCapacity = 2;
  if (capacity !== undefined) {
    if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 10) {
      throw new ApiError("Capacity must be a whole number between 1 and 10.");
    }
    parsedCapacity = capacity;
  } else if (requireAll) {
    throw new ApiError("Capacity is required.");
  }

  return {
    fullName: fullName ?? "",
    studentId: studentId ?? "",
    email: email?.toLowerCase() ?? "",
    phone: phone ?? "",
    batch: batch ?? "",
    communicationMethod: communicationMethod ?? "Email",
    profilePhotoUrl,
    capacity: parsedCapacity,
  };
}
