import { NextResponse } from 'next/server';
import { ensureConnection } from '@/lib/db';
import { seedPropertyTypes } from '@/models/seed';

export async function POST() {
  try {
    await ensureConnection();
    await seedPropertyTypes();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully'
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 