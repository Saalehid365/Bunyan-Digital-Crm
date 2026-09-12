const CALENDLY_API_BASE = "https://api.calendly.com";
const REQUEST_TIMEOUT_MS = 8000;

export type CalendlyResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function calendlyFetch(path: string, token: string): Promise<CalendlyResult<unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${CALENDLY_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: "That Calendly token is invalid or has been revoked." };
      return { ok: false, error: `Calendly returned an error (${res.status}).` };
    }
    return { ok: true, data: await res.json() };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Calendly is taking too long to respond. Try again shortly." };
    }
    return { ok: false, error: "Couldn't reach Calendly. Check your connection and try again." };
  } finally {
    clearTimeout(timeout);
  }
}

export type CalendlyIdentity = { uri: string; name: string; email: string };

/** Validates a Personal Access Token and captures the identity needed to scope future lookups. */
export async function fetchCalendlyCurrentUser(token: string): Promise<CalendlyResult<CalendlyIdentity>> {
  const result = await calendlyFetch("/users/me", token);
  if (!result.ok) return result;
  const resource = (result.data as { resource?: { uri?: string; name?: string; email?: string } })?.resource;
  if (!resource?.uri) return { ok: false, error: "Unexpected response from Calendly." };
  return { ok: true, data: { uri: resource.uri, name: resource.name ?? "Calendly", email: resource.email ?? "" } };
}

export type CalendlyMeeting = {
  uri: string;
  name: string;
  startTime: string;
  endTime: string;
  locationLabel: string;
  joinUrl: string | null;
  inviteeCount: number;
};

const LOCATION_LABEL: Record<string, string> = {
  google_conference: "Google Meet",
  zoom: "Zoom",
  gotomeeting: "GoToMeeting",
  microsoft_teams_conference: "Microsoft Teams",
  webex_conference: "WebEx",
  outbound_call: "Phone call",
  inbound_call: "Phone call",
  physical: "In person",
  custom: "Custom location",
  ask_invitee: "Location TBD",
};

function describeLocation(location: unknown): { label: string; joinUrl: string | null } {
  const loc = location as { type?: string; join_url?: string; location?: string } | null | undefined;
  if (!loc?.type) return { label: "Meeting", joinUrl: null };
  const label = loc.type === "custom" && loc.location ? loc.location : (LOCATION_LABEL[loc.type] ?? "Meeting");
  return { label, joinUrl: loc.join_url ?? null };
}

/** Fetches the user's own upcoming (not-yet-started) confirmed meetings, soonest first. */
export async function fetchUpcomingCalendlyMeetings(
  token: string,
  userUri: string,
  opts?: { count?: number; daysAhead?: number },
): Promise<CalendlyResult<CalendlyMeeting[]>> {
  const count = opts?.count ?? 10;
  const daysAhead = opts?.daysAhead ?? 14;
  const minStartTime = new Date().toISOString();
  const maxStartTime = new Date(Date.now() + daysAhead * 86_400_000).toISOString();

  const params = new URLSearchParams({
    user: userUri,
    status: "active",
    sort: "start_time:asc",
    count: String(count),
    min_start_time: minStartTime,
    max_start_time: maxStartTime,
  });

  const result = await calendlyFetch(`/scheduled_events?${params.toString()}`, token);
  if (!result.ok) return result;

  const collection = (result.data as { collection?: unknown[] })?.collection ?? [];
  const meetings: CalendlyMeeting[] = collection.map((raw) => {
    const event = raw as {
      uri: string;
      name: string | null;
      start_time: string;
      end_time: string;
      location: unknown;
      invitees_counter?: { total?: number };
    };
    const { label, joinUrl } = describeLocation(event.location);
    return {
      uri: event.uri,
      name: event.name ?? "Untitled meeting",
      startTime: event.start_time,
      endTime: event.end_time,
      locationLabel: label,
      joinUrl,
      inviteeCount: event.invitees_counter?.total ?? 0,
    };
  });

  return { ok: true, data: meetings };
}
