export class ClientApiError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
  }
}

function parseErrorPayload(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

export async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new ClientApiError("Could not reach the server. Check that the app is running and try again.");
  }
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new ClientApiError(parseErrorPayload(payload, "Unable to load data."));
  return payload as T;
}

export async function postJson<T>(url: string, body: unknown, headers?: HeadersInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ClientApiError("Could not reach the server. Check that the app is running and try again.");
  }
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const field = typeof payload === "object" && payload && "field" in payload && typeof payload.field === "string" ? payload.field : undefined;
    throw new ClientApiError(parseErrorPayload(payload, "Request failed. Please try again."), field);
  }
  return payload as T;
}
