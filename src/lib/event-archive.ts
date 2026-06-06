import JSZip from "jszip";
import { SEGMENTS } from "@/lib/constants";
import { getSegmentLabel } from "@/lib/utils";
import type { EventSegment, Guest, Upload, WeddingEvent } from "@/types";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-") || "file";
}

function dataUrlToBase64(dataUrl: string): { base64: string; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { base64: "", ext: "jpg" };
  const mime = match[1];
  const ext = mime.includes("video") ? "webm" : mime.includes("png") ? "png" : "jpg";
  return { base64: match[2], ext };
}

function photoFileName(upload: Upload, index: number): string {
  const guest = sanitizeFilename(upload.guestName);
  const segment = sanitizeFilename(upload.segment);
  const { ext } = dataUrlToBase64(upload.imageData);
  const time = new Date(upload.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${guest}/${segment}/${String(index + 1).padStart(3, "0")}-${time}.${ext}`;
}

export async function downloadPhotosZip(
  uploads: Upload[],
  zipName: string,
  filterLabel?: string
): Promise<void> {
  if (uploads.length === 0) return;

  const zip = new JSZip();
  uploads.forEach((upload, index) => {
    const { base64 } = dataUrlToBase64(upload.imageData);
    if (!base64) return;
    zip.file(photoFileName(upload, index), base64, { base64: true });
  });

  if (filterLabel) {
    zip.file(
      "README.txt",
      `${filterLabel}\n${uploads.length} photo(s)\nExported from Wedding POV\n`
    );
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, zipName);
}

export async function downloadPhotosByGuest(
  uploads: Upload[],
  guestName: string,
  eventLabel: string
): Promise<void> {
  const guestUploads = uploads.filter((u) => u.guestName === guestName);
  await downloadPhotosZip(
    guestUploads,
    `${sanitizeFilename(eventLabel)}-${sanitizeFilename(guestName)}-photos.zip`,
    `${guestName} POV — ${guestUploads.length} photos`
  );
}

export async function downloadPhotosBySegment(
  uploads: Upload[],
  segment: EventSegment,
  eventLabel: string
): Promise<void> {
  const segmentUploads = uploads.filter((u) => u.segment === segment);
  const label = SEGMENTS.find((s) => s.value === segment)?.label ?? segment;
  await downloadPhotosZip(
    segmentUploads,
    `${sanitizeFilename(eventLabel)}-${sanitizeFilename(label)}.zip`,
    `${label} — ${segmentUploads.length} photos`
  );
}

export function downloadGuestListCsv(
  event: WeddingEvent,
  guests: Guest[],
  uploads: Upload[]
): void {
  const counts = uploads.reduce<Record<string, number>>((acc, u) => {
    acc[u.guestName] = (acc[u.guestName] ?? 0) + 1;
    return acc;
  }, {});

  const header = "First Name,Last Name,Relationship,Joined At,Photos Uploaded";
  const rows = guests.map((g) => {
    const name = `${g.firstName} ${g.lastName}`;
    return [
      g.firstName,
      g.lastName,
      g.relationship ?? "",
      g.joinedAt,
      String(counts[name] ?? 0),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [header, ...rows].join("\n");
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${sanitizeFilename(event.coupleName)}-guest-list.csv`
  );
}

export function downloadEventSummaryHtml(
  event: WeddingEvent,
  guests: Guest[],
  uploads: Upload[]
): void {
  const segmentCounts = uploads.reduce<Record<string, number>>((acc, u) => {
    const label = getSegmentLabel(u.segment);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${event.coupleName} — Wedding POV Summary</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; color: #2c2c2c; line-height: 1.6; }
    h1 { color: #c9a962; }
    .meta { color: #6b6560; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    td, th { border-bottom: 1px solid #eee; padding: 0.5rem 0; text-align: left; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>${event.coupleName}</h1>
  <p class="meta">${event.weddingDate} · ${event.venue}<br/>${event.settings.hashtag}</p>
  <h2>Wedding Summary</h2>
  <p><strong>Total Photos:</strong> ${uploads.length}</p>
  <p><strong>Total Guests:</strong> ${guests.length}</p>
  <h3>Photos by Section</h3>
  <table>
    ${Object.entries(segmentCounts)
      .map(([label, count]) => `<tr><td>${label}</td><td>${count}</td></tr>`)
      .join("")}
  </table>
  <h3>Top Contributors</h3>
  <table>
    ${Object.entries(
      uploads.reduce<Record<string, number>>((acc, u) => {
        acc[u.guestName] = (acc[u.guestName] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => `<tr><td>${name}</td><td>${count} photos</td></tr>`)
      .join("")}
  </table>
  <p style="margin-top:2rem;font-size:0.85rem;color:#999">Exported from Wedding POV · Print this page to save as PDF</p>
</body>
</html>`;

  triggerDownload(
    new Blob([html], { type: "text/html;charset=utf-8" }),
    `${sanitizeFilename(event.coupleName)}-wedding-summary.html`
  );
}

export async function downloadFullEventBackup(
  event: WeddingEvent,
  guests: Guest[],
  uploads: Upload[]
): Promise<void> {
  const zip = new JSZip();
  const label = sanitizeFilename(event.coupleName);

  zip.file(
    "event-config.json",
    JSON.stringify(
      {
        event: {
          id: event.id,
          coupleName: event.coupleName,
          weddingDate: event.weddingDate,
          venue: event.venue,
          settings: event.settings,
          photoLimits: event.photoLimits,
          theme: event.theme,
          slideshow: event.slideshow,
          moderation: event.moderation,
          photoManagement: event.photoManagement,
        },
        guests,
        photoCount: uploads.length,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const csvHeader = "First Name,Last Name,Relationship,Joined At,Photos Uploaded";
  const counts = uploads.reduce<Record<string, number>>((acc, u) => {
    acc[u.guestName] = (acc[u.guestName] ?? 0) + 1;
    return acc;
  }, {});
  const csvRows = guests.map((g) => {
    const name = `${g.firstName} ${g.lastName}`;
    return [g.firstName, g.lastName, g.relationship ?? "", g.joinedAt, String(counts[name] ?? 0)]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });
  zip.file("guest-list.csv", [csvHeader, ...csvRows].join("\n"));

  const photosFolder = zip.folder("photos");
  uploads.forEach((upload, index) => {
    const { base64 } = dataUrlToBase64(upload.imageData);
    if (!base64 || !photosFolder) return;
    photosFolder.file(photoFileName(upload, index), base64, { base64: true });
  });

  zip.file(
    "README.txt",
    `Wedding POV Full Event Backup\n${event.coupleName}\n${uploads.length} photos · ${guests.length} guests\n`
  );

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `${label}-wedding-backup.zip`);
}

export function getGuestNamesFromUploads(uploads: Upload[]): string[] {
  return [...new Set(uploads.map((u) => u.guestName))].sort();
}
