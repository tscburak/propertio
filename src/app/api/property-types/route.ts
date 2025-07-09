import { NextResponse } from 'next/server';
import { ensureConnection } from '@/lib/db';
import { PropertyType } from '@/models/PropertyType';

export async function GET() {
  try {
    await ensureConnection();

    const propertyTypes = await PropertyType.find().sort({ label: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: propertyTypes
    });

  } catch (error) {
    console.error('Error fetching property types:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 