/** "John Doe" → "John Doe's", "Michael Reyes" → "Michael Reyes'" */
export function toPossessive(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (/s$/i.test(trimmed)) return `${trimmed}'`;
  return `${trimmed}'s`;
}

export function formatGuestPOV(guest: { firstName: string; lastName: string }): string {
  const full = `${guest.firstName} ${guest.lastName}`.trim();
  return `${toPossessive(full)} POV`;
}

export function formatGuestNamePOV(fullName: string): string {
  return `${toPossessive(fullName)} POV`;
}

export function formatGuestPOVUpper(guest: { firstName: string; lastName: string }): string {
  const full = `${guest.firstName} ${guest.lastName}`.trim().toUpperCase();
  return `${toPossessive(full)} POV`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatGuestNamePOVUpper(fullName: string): string {
  return formatGuestNamePOV(fullName).toUpperCase();
}

export function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    ceremony: "Ceremony",
    cocktails: "Cocktails",
    reception: "Reception",
    "first-dance": "First Dance",
    speeches: "Speeches",
    other: "Other",
  };
  return labels[segment] ?? segment;
}
