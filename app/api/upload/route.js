// app/api/upload/route.js
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  const formData = await req.formData();
  const files = formData.getAll('files'); // يمكن أن يكون عدة ملفات بنفس المفتاح

  const uploadDir = path.join(process.cwd(), '/public/uploads');

  // أنشئ المجلد إن لم يكن موجودًا
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error('Error creating upload directory:', err);
    return NextResponse.json({ message: 'Failed to create upload directory' }, { status: 500 });
  }

  const urls = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);

    try {
      await fs.writeFile(filepath, buffer);
      urls.push(`/uploads/${filename}`);
    } catch (err) {
      console.error('Error writing file:', err);
      return NextResponse.json({ message: 'File upload failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ urls });
}
