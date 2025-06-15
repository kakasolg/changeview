import { NextResponse } from 'next/server';
import clientPromise from '@/lib/database';
import Hexagram from '@/models/Hexagram';

export async function GET() {
  try {
    await clientPromise();
    const hexagrams = await Hexagram.find({}).sort({ number: 1 });
    return NextResponse.json({ success: true, data: hexagrams });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch all hexagrams', 
      error: {
        type: error.name || 'DatabaseError',
        message: error.message || 'Unknown database error'
      }
    }, { status: 500 });
  }
}
