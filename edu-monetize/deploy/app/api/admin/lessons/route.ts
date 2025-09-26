import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const adminPassword = process.env.ADMIN_PASSWORD;
const uploadDir = process.env.UPLOAD_DIR || "public/uploads";

const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

async function ensureUploadDir() {
  const absoluteUploadDir = path.join(process.cwd(), uploadDir);
  await fs.mkdir(absoluteUploadDir, { recursive: true });
  return absoluteUploadDir;
}

export async function GET() {
  const lessons = await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest) {
  if (!adminPassword || req.headers.get("x-admin-password") !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const formData = await req.formData();
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || undefined;
  const video = formData.get("video") as File | null;
  const notes = formData.get("notes") as File | null;
  const presentation = formData.get("presentation") as File | null;

  const parsed = lessonSchema.safeParse({ title, description });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseDir = await ensureUploadDir();

  async function saveFile(file: File | null, subdir: string) {
    if (!file) return undefined as string | undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname((file as any).name || "");
    const unique = `${uuidv4()}${ext}`;
    const outDir = path.join(baseDir, subdir);
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, unique);
    await fs.writeFile(outPath, buffer);
    // return public URL path
    return `/${uploadDir.replace(/^public\//, "")}/${subdir}/${unique}`;
  }

  const [videoUrl, notesUrl, presentationUrl] = await Promise.all([
    saveFile(video, "videos"),
    saveFile(notes, "notes"),
    saveFile(presentation, "presentations"),
  ]);

  if (!videoUrl) {
    return NextResponse.json({ error: "Video is required" }, { status: 400 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      title,
      description,
      videoUrl,
      notesUrl,
      presentationUrl,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}