import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select(`
        *,
        property_types (*),
        chains (*),
        areas (*),
        hotel_amenities (
          amenities (*)
        ),
        rooms (
          *,
          room_packages (*)
        ),
        review_aggregates (*)
      `);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Hotels API Error:', error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
