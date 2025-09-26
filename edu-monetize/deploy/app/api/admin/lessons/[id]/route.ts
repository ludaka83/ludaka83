import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import path from "path";
import fs from "fs/promises";

const adminPassword = process.env.ADMIN_PASSWORD;

async function deleteIfExists(absolutePath: string) {
  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore missing files or fs errors
  }
}

function toAbsolutePublicPath(publicUrlPath: string | null | undefined): string | null {
  if (!publicUrlPath) return null;
  const relative = publicUrlPath.replace(/^\//, "");
  return path.join(process.cwd(), "public", relative);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!adminPassword || req.headers.get("x-admin-password") !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessonId = params.id;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const pathsToDelete = [lesson.videoUrl, lesson.notesUrl, lesson.presentationUrl]
    .map(toAbsolutePublicPath)
    .filter((p): p is string => Boolean(p));

  await Promise.all(pathsToDelete.map(deleteIfExists));

  await prisma.lesson.delete({ where: { id: lessonId } });

  return new NextResponse(null, { status: 204 });
}

