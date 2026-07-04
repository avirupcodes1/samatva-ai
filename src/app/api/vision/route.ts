import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/storage";
import { visionReflect } from "@/lib/gemma";
import { uid, daysUntil } from "@/lib/utils";
import { VISION_KINDS, type VisionEntry, type VisionKind } from "@/lib/types";

// Gemma 4 vision + thinking can take a while; give the function room.
export const maxDuration = 60;

// Cap the incoming data URL well under Vercel's ~4.5MB body limit. Clients
// resize to ~800px first, so real uploads are ~50-150KB.
const MAX_IMAGE_CHARS = 5_000_000;
const VALID_KINDS = new Set<string>(VISION_KINDS.map((k) => k.id));

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await db.getVisions(user.id);
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const kind = String(body.kind ?? "");
  const image = String(body.image ?? "");

  if (!VALID_KINDS.has(kind))
    return NextResponse.json({ error: "Please choose what the photo is." }, { status: 400 });
  if (!image.startsWith("data:image/"))
    return NextResponse.json({ error: "Please upload a valid image." }, { status: 400 });
  if (image.length > MAX_IMAGE_CHARS)
    return NextResponse.json({ error: "That image is too large — try a smaller photo." }, { status: 413 });

  // The image is passed to Gemma and then discarded — never stored or logged.
  const reflection = await visionReflect(image, kind as VisionKind, {
    name: user.name,
    exam: user.exam,
    daysToExam: daysUntil(user.examDate),
  });

  const entry: VisionEntry = {
    id: uid("v_"),
    userId: user.id,
    kind: kind as VisionKind,
    reflection, // only the text is persisted
    createdAt: new Date().toISOString(),
  };
  await db.addVision(entry);

  return NextResponse.json({ entry }, { status: 201 });
}
