import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/lib/db';
import { Property } from '@/models/Property';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureConnection();

    const propertyId = params.id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Process each image
    for (const image of images) {
      if (!image.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = image.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${randomString}.${extension}`;
      
      // Save file to public/uploads directory
      const filePath = join(uploadsDir, filename);
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filePath, buffer);
      
      // Add to uploaded URLs
      const imageUrl = `/uploads/${filename}`;
      uploadedUrls.push(imageUrl);
    }

    // Update property with new image URLs
    if (uploadedUrls.length > 0) {
      property.images = [...property.images, ...uploadedUrls];
      await property.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        urls: uploadedUrls
      },
      message: `${uploadedUrls.length} image(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 