import { NextRequest, NextResponse } from 'next/server';
import { ensureConnection } from '@/lib/db';
import { Property } from '@/models/Property';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize Cloudflare R2 client
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'propertio';
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const region = process.env.CLOUDFLARE_R2_REGION || 'auto';
const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'propertio.tscblogs.com';

const s3Client = new S3Client({
  region,
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});

async function uploadImage(blob: Blob, propertyId: string, fileName: string): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  
  // Determine file extension from blob type
  let extension = 'png'; // default
  if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
    extension = 'jpg';
  } else if (blob.type.includes('webp')) {
    extension = 'webp';
  } else if (blob.type.includes('gif')) {
    extension = 'gif';
  }
  
  const key = `${propertyId}/${fileName}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: blob.type || "image/png",
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  });
    
  await s3Client.send(command);
  return `https://${publicDomain}/${key}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();

    const { id: propertyId } = await params;

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

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 configuration missing' },
        { status: 500 }
      );
    }

    const uploadedUrls: string[] = [];

    // Process each image
    for (const image of images) {
      if (!image.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      try {
        // Generate unique filename
        const filename = uuidv4();
        
        // Use the actual property ID from the database
        const actualPropertyId = property._id.toString();
        
        // Upload image using the uploadImage function
        const imageUrl = await uploadImage(image, actualPropertyId, filename);
        uploadedUrls.push(imageUrl);

      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue with other images even if one fails
      }
    }

    // Update property with new image URLs using atomic operation
    if (uploadedUrls.length > 0) {
      await Property.findByIdAndUpdate(
        propertyId,
        { $push: { images: { $each: uploadedUrls } } },
        { new: true }
      );
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