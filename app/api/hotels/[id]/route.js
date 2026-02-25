import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Invalid hotel id' },
        { status: 400 }
      );
    }

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
        review_aggregates (*),
        hotel_faqs (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Hotel API Error:', error);

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}