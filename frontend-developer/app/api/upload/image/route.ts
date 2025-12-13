import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

function getImageKitInstance() {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error('Missing required ImageKit environment variables (NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY, NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)');
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

export async function POST(request: NextRequest) {
  try {
    const imagekit = getImageKitInstance();
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const folder = (formData.get('folder') as string) || '/posts';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Received file:', file.name, 'Size:', file.size, 'Folder:', folder);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to ImageKit with specified folder
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: folder, 
    });

    console.log('ImageKit upload successful:', uploadResponse.url);

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}