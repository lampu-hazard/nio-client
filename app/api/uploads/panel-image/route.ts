import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'panel-image';
}

async function saveToVercelBlob(file: File, filename: string) {
  const { put } = await import('@vercel/blob');
  const blob = await put(`panels/${filename}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });
  return blob.url;
}

async function saveToPublicFolder(file: File, filename: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'panels');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);
  return `/uploads/panels/${filename}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: 'File gambar wajib diupload' }, { status: 400 });
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json({ ok: false, message: 'Format gambar harus PNG, JPG, WEBP, atau GIF' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, message: 'Ukuran gambar maksimal 5 MB' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    const baseName = safeName(file.name.replace(/\.[^.]+$/, ''));
    const filename = `${Date.now()}-${baseName}.${ext}`;
    const url = process.env.BLOB_READ_WRITE_TOKEN
      ? await saveToVercelBlob(file, filename)
      : await saveToPublicFolder(file, filename);

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const isVercel = Boolean(process.env.VERCEL);
    const fallbackMessage = isVercel && !process.env.BLOB_READ_WRITE_TOKEN
      ? 'Upload di Vercel butuh Vercel Blob. Tambahkan BLOB_READ_WRITE_TOKEN di Environment Variables.'
      : 'Gagal upload gambar';

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message || fallbackMessage : fallbackMessage },
      { status: 500 },
    );
  }
}
