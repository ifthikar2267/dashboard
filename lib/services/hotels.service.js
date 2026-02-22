import supabase from '../supabase/client';

/**
 * @param {Object} filters
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function getHotels(filters = {}) {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: null, error: 'Supabase not configured' };
    }

    let query = supabase
      .from('hotels')
      .select('*')
      .order('rank', { ascending: true });

    if (filters.search) {
      query = query.or(
        `name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%`
      );
    }
    if (filters.type_id) query = query.eq('type_id', filters.type_id);
    if (filters.area_id) query = query.eq('area_id', filters.area_id);
    if (filters.status) query = query.eq('status', filters.status);

    const { data: hotels, error } = await query;

    if (error) {
      console.error('Supabase error fetching hotels:', error);
      throw error;
    }

    if (hotels && hotels.length > 0) {
      const typeIds = [...new Set(hotels.map((h) => h.type_id).filter(Boolean))];
      const chainIds = [...new Set(hotels.map((h) => h.chain_id).filter(Boolean))];
      const areaIds = [...new Set(hotels.map((h) => h.area_id).filter(Boolean))];

      let types = {},
        chains = {},
        areas = {};

      if (typeIds.length > 0) {
        const { data: typesData } = await supabase
          .from('property_types')
          .select('id, name_en')
          .in('id', typeIds);
        if (typesData) types = Object.fromEntries(typesData.map((t) => [t.id, t]));
      }
      if (chainIds.length > 0) {
        const { data: chainsData } = await supabase
          .from('chains')
          .select('id, name_en')
          .in('id', chainIds);
        if (chainsData) chains = Object.fromEntries(chainsData.map((c) => [c.id, c]));
      }
      if (areaIds.length > 0) {
        const { data: areasData } = await supabase
          .from('areas')
          .select('id, name_en')
          .in('id', areaIds);
        if (areasData) areas = Object.fromEntries(areasData.map((a) => [a.id, a]));
      }

      const enrichedHotels = hotels.map((hotel) => ({
        ...hotel,
        type: types[hotel.type_id] || null,
        chain: chains[hotel.chain_id] || null,
        area: areas[hotel.area_id] || null,
      }));

      return { data: enrichedHotels, error: null };
    }

    return { data: hotels || [], error: null };
  } catch (error) {
    console.error('Error fetching hotels:', error.message || error);
    return { data: null, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * @param {number} id - Hotel ID
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getHotelById(id) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching hotel:', error);
      throw error;
    }

    if (!hotel) return { data: null, error: 'Hotel not found' };

    const promises = [];
    if (hotel.type_id) {
      promises.push(
        supabase.from('property_types').select('id, name_en').eq('id', hotel.type_id).single()
      );
    } else promises.push(Promise.resolve({ data: null }));
    if (hotel.chain_id) {
      promises.push(
        supabase.from('chains').select('id, name_en').eq('id', hotel.chain_id).single()
      );
    } else promises.push(Promise.resolve({ data: null }));
    if (hotel.area_id) {
      promises.push(
        supabase.from('areas').select('id, name_en').eq('id', hotel.area_id).single()
      );
    } else promises.push(Promise.resolve({ data: null }));

    const [typeResult, chainResult, areaResult] = await Promise.all(promises);

    return {
      data: {
        ...hotel,
        type: typeResult.data || null,
        chain: chainResult.data || null,
        area: areaResult.data || null,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching hotel:', error.message || error);
    return { data: null, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Fetch hotel with all related data (rooms + packages, amenities)
 * @param {number} id - Hotel ID
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getHotelComplete(id) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const [hotelResult, amenitiesResult, roomsResult, reviewsResult] = await Promise.all([
      supabase.from('hotels').select('*').eq('id', id).single(),
      supabase.from('hotel_amenities').select('amenity_id').eq('hotel_id', id),
      supabase.from('rooms').select('*').eq('hotel_id', id).order('id', { ascending: true }),
      supabase.from('review_aggregates').select('*').eq('hotel_id', id).order('id', { ascending: true }),
    ]);

    if (hotelResult.error) throw hotelResult.error;
    if (!hotelResult.data) return { data: null, error: 'Hotel not found' };

    const hotel = hotelResult.data;

    if (roomsResult.error) {
      console.warn('Rooms query failed, returning empty rooms.', roomsResult.error);
    }
    const rooms = roomsResult.error ? [] : (roomsResult.data || []);
    const roomIds = rooms.map((r) => r.id).filter(Boolean);

    let roomPackagesByRoomId = {};
    if (roomIds.length > 0) {
      const { data: roomPackages, error: pkgError } = await supabase
        .from('room_packages')
        .select('*')
        .in('room_id', roomIds)
        .order('id', { ascending: true });

      if (pkgError) {
        console.warn('Room packages query failed.', pkgError);
      } else if (roomPackages) {
        roomPackagesByRoomId = roomPackages.reduce((acc, pkg) => {
          acc[pkg.room_id] = acc[pkg.room_id] || [];
          acc[pkg.room_id].push(pkg);
          return acc;
        }, {});
      }
    }

    const roomsWithPackages = rooms.map((room) => ({
      ...room,
      images: Array.isArray(room.images) ? room.images : [],
      packages: roomPackagesByRoomId[room.id] || [],
    }));

    const relatedPromises = [];
    if (hotel.type_id) {
      relatedPromises.push(
        supabase.from('property_types').select('id, name_en, name_ar').eq('id', hotel.type_id).single()
      );
    } else relatedPromises.push(Promise.resolve({ data: null }));
    if (hotel.chain_id) {
      relatedPromises.push(
        supabase.from('chains').select('id, name_en, name_ar').eq('id', hotel.chain_id).single()
      );
    } else relatedPromises.push(Promise.resolve({ data: null }));
    if (hotel.area_id) {
      relatedPromises.push(
        supabase.from('areas').select('id, name_en, name_ar').eq('id', hotel.area_id).single()
      );
    } else relatedPromises.push(Promise.resolve({ data: null }));

    const [typeResult, chainResult, areaResult] = await Promise.all(relatedPromises);

    const reviewAggregates = reviewsResult.error ? [] : (reviewsResult.data || []);

    return {
      data: {
        ...hotel,
        type: typeResult.data || null,
        chain: chainResult.data || null,
        area: areaResult.data || null,
        amenities: (amenitiesResult.data || []).map((a) => a.amenity_id),
        rooms: roomsWithPackages,
        review_aggregates: reviewAggregates,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching complete hotel:', error.message || error);
    return { data: null, error: error.message || 'Failed to fetch complete hotel data' };
  }
}

/**
 * @param {Object} hotelData
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function createHotel(hotelData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('hotels')
      .insert([hotelData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating hotel:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error creating hotel:', error.message || error);
    return { data: null, error: error.message || 'Failed to create hotel' };
  }
}

/**
 * @param {number} id
 * @param {Object} hotelData
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function updateHotel(id, hotelData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('hotels')
      .update(hotelData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating hotel:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Error updating hotel:', error.message || error);
    return { data: null, error: error.message || 'Failed to update hotel' };
  }
}

/**
 * @param {number} id
 * @returns {Promise<{ error: string|null }>}
 */
export async function deleteHotel(id) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    const { error } = await supabase.from('hotels').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting hotel:', error);
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Error deleting hotel:', error.message || error);
    return { error: error.message || 'Failed to delete hotel' };
  }
}

/**
 * @param {number} hotelId
 * @param {string[]} imageUrls
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function saveHotelImageUrls(hotelId, imageUrls) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const imagesData = (imageUrls || []).map((url, index) => ({
      url,
      isPrimary: index === 0,
      sortOrder: index,
    }));

    const { data, error } = await supabase
      .from('hotels')
      .update({
        images: imagesData,
        image_url: imageUrls && imageUrls[0] ? imageUrls[0] : null,
      })
      .eq('id', hotelId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving image URLs:', error.message || error);
    return { data: null, error: error.message || 'Failed to save image URLs' };
  }
}

function toNumber(value) {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 10% and 20% of base price; used for room_packages. */
function computePackageDerivedFields(basePrice) {
  const base = +toNumber(basePrice).toFixed(2);
  const first = +(base * 1.1).toFixed(2);
  return {
    first_price: first,
    base_price: base,
    almosafer_points: +(base * 0.1).toFixed(2),
    shukran_points: +(base * 0.2).toFixed(2),
  };
}

/**
 * Normalize room input for DB. Matches rooms table: hotel_id, room_type, bedding, view, images (JSONB).
 * @param {number} hotelId
 * @param {Object} room - May contain extra keys; only allowed keys are used.
 * @returns {Object} Row for rooms table.
 */
function normalizeRoomForInsert(hotelId, room) {
  const images = Array.isArray(room.images) ? room.images : [];
  return {
    hotel_id: hotelId,
    room_type: room.room_type ?? '',
    bedding: room.bedding ?? '',
    view: room.view ?? '',
    images: images,
  };
}

/**
 * Build one room_packages row. Calculates almosafer_points and shukran_points from base_price.
 * @param {number} roomId
 * @param {Object} pkg - { meal_board, cancellation_policy, base_price }
 * @returns {Object} Row for room_packages table.
 */
function buildPackageRow(roomId, pkg) {
  const base = +(parseFloat(pkg.base_price) || 0).toFixed(2);
  const first = pkg.first_price != null && pkg.first_price !== ''
    ? +(parseFloat(pkg.first_price) || 0).toFixed(2)
    : +(base * 1.1).toFixed(2);
  return {
    room_id: roomId,
    meal_board: pkg.meal_board ?? '',
    cancellation_policy: pkg.cancellation_policy ?? '',
    first_price: first,
    base_price: base,
    almosafer_points: +(base * 0.1).toFixed(2),
    shukran_points: +(base * 0.2).toFixed(2),
  };
}

/**
 * Save OTA rooms and packages for a hotel.
 * Room creation accepts only: hotel_id, room_type, bedding, view, capacity, images.
 * Does NOT use: room_name, description, amenities.
 * Package creation calculates and stores almosafer_points and shukran_points in room_packages.
 *
 * @param {number} hotelId
 * @param {Array} rooms - Each item: { room_type, bedding, view, capacity?, images?, packages? }
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function saveHotelRooms(hotelId, rooms) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    if (!rooms || rooms.length === 0) {
      return { data: [], error: null };
    }

    const insertedRooms = [];

    for (const room of rooms) {
      const roomPayload = normalizeRoomForInsert(hotelId, room);

      const { data: insertedRoom, error: roomError } = await supabase
        .from('rooms')
        .insert([roomPayload])
        .select()
        .single();

      if (roomError) {
        console.error('Supabase error inserting room:', roomError);
        throw roomError;
      }

      insertedRooms.push(insertedRoom);

      const packages = Array.isArray(room.packages) ? room.packages : [];
      if (packages.length > 0) {
        const packagesPayload = packages.map((pkg) =>
          buildPackageRow(insertedRoom.id, pkg)
        );

        const { error: pkgError } = await supabase
          .from('room_packages')
          .insert(packagesPayload);

        if (pkgError) {
          console.error('Supabase error inserting room packages:', pkgError);
          throw pkgError;
        }
      }
    }

    return { data: insertedRooms, error: null };
  } catch (error) {
    console.error('Error saving rooms:', error.message || error);
    return { data: null, error: error.message || 'Failed to save rooms' };
  }
}

/**
 * Update OTA rooms: delete existing for hotel then reinsert
 * @param {number} hotelId
 * @param {Array} rooms
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function updateHotelRooms(hotelId, rooms) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('hotel_id', hotelId);

    if (deleteError) {
      console.error('Error deleting old rooms:', deleteError);
      throw deleteError;
    }

    if (rooms && rooms.length > 0) {
      return await saveHotelRooms(hotelId, rooms);
    }

    return { data: [], error: null };
  } catch (error) {
    console.error('Error updating rooms:', error.message || error);
    return { data: null, error: error.message || 'Failed to update rooms' };
  }
}

/**
 * @param {number} hotelId
 * @param {number[]} amenityIds
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function saveHotelAmenities(hotelId, amenityIds) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    if (!amenityIds || amenityIds.length === 0) {
      return { data: [], error: null };
    }

    const amenitiesData = amenityIds.map((amenityId) => ({
      hotel_id: hotelId,
      amenity_id: amenityId,
    }));

    const { data, error } = await supabase
      .from('hotel_amenities')
      .insert(amenitiesData)
      .select();

    if (error) {
      console.error('Supabase error saving hotel amenities:', error);
      throw error;
    }
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error saving hotel amenities:', error.message || error);
    return { data: null, error: error.message || 'Failed to save hotel amenities' };
  }
}

/**
 * @param {number} hotelId
 * @param {number[]} amenityIds
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function updateHotelAmenities(hotelId, amenityIds) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { error: deleteError } = await supabase
      .from('hotel_amenities')
      .delete()
      .eq('hotel_id', hotelId);

    if (deleteError) {
      console.error('Error deleting old hotel amenities:', deleteError);
      throw deleteError;
    }

    if (amenityIds && amenityIds.length > 0) {
      return await saveHotelAmenities(hotelId, amenityIds);
    }

    return { data: [], error: null };
  } catch (error) {
    console.error('Error updating hotel amenities:', error.message || error);
    return { data: null, error: error.message || 'Failed to update hotel amenities' };
  }
}

/**
 * Insert review aggregates for a hotel (create flow).
 * @param {number} hotelId
 * @param {Array<{ source: string, average_rating: number, total_reviews: number }>} reviews
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function saveHotelReviewAggregates(hotelId, reviews) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }
    if (!reviews || reviews.length === 0) {
      return { data: [], error: null };
    }
    const now = new Date().toISOString();
    const rows = reviews
      .filter((r) => r && String(r.source || '').trim() !== '')
      .map((r) => ({
        hotel_id: hotelId,
        source: String(r.source || '').trim(),
        average_rating: Number(parseFloat(r.average_rating) || 0),
        total_reviews: Math.max(0, parseInt(r.total_reviews, 10) || 0),
        last_updated: now,
      }));
    if (rows.length === 0) return { data: [], error: null };
    const { data, error } = await supabase
      .from('review_aggregates')
      .insert(rows)
      .select();
    if (error) {
      console.error('Supabase error saving review aggregates:', error);
      throw error;
    }
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error saving review aggregates:', error.message || error);
    return { data: null, error: error.message || 'Failed to save review aggregates' };
  }
}

/**
 * Upsert review aggregates by (hotel_id, source) and delete removed sources (edit flow).
 * @param {number} hotelId
 * @param {Array<{ id?: number, source: string, average_rating: number, total_reviews: number }>} reviews
 * @returns {Promise<{ data: Array|null, error: string|null }>}
 */
export async function updateHotelReviewAggregates(hotelId, reviews) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }
    const { data: existing } = await supabase
      .from('review_aggregates')
      .select('id, source')
      .eq('hotel_id', hotelId);
    const sourcesInForm = (reviews || [])
      .filter((r) => r && String(r.source || '').trim() !== '')
      .map((r) => String(r.source || '').trim());
    const toDelete = (existing || []).filter((e) => !sourcesInForm.includes(e.source)).map((e) => e.id);
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('review_aggregates')
        .delete()
        .in('id', toDelete);
      if (deleteError) {
        console.error('Error deleting removed review aggregates:', deleteError);
        throw deleteError;
      }
    }
    const now = new Date().toISOString();
    const rows = (reviews || [])
      .filter((r) => r && String(r.source || '').trim() !== '')
      .map((r) => ({
        hotel_id: hotelId,
        source: String(r.source || '').trim(),
        average_rating: Number(parseFloat(r.average_rating) || 0),
        total_reviews: Math.max(0, parseInt(r.total_reviews, 10) || 0),
        last_updated: now,
      }));
    if (rows.length === 0) return { data: [], error: null };
    const { error: upsertError } = await supabase
      .from('review_aggregates')
      .upsert(rows, { onConflict: 'hotel_id,source' });
    if (upsertError) {
      console.error('Supabase error upserting review aggregates:', upsertError);
      throw upsertError;
    }
    const { data: updated } = await supabase
      .from('review_aggregates')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('id', { ascending: true });
    return { data: updated || [], error: null };
  } catch (error) {
    console.error('Error updating review aggregates:', error.message || error);
    return { data: null, error: error.message || 'Failed to update review aggregates' };
  }
}

/**
 * Full hotel update (main record + amenities, rooms, images)
 * @param {number} id - Hotel ID
 * @param {Object} hotelData - Main hotel fields
 * @param {Object} relatedData - { amenities?, rooms?, imageUrls?, reviewAggregates? }
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function updateHotelComplete(id, hotelData, relatedData = {}) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data: updatedHotel, error: hotelError } = await updateHotel(id, hotelData);
    if (hotelError) return { data: null, error: hotelError };

    const updatePromises = [];

    if (relatedData.amenities !== undefined) {
      updatePromises.push(updateHotelAmenities(id, relatedData.amenities));
    }
    if (relatedData.rooms !== undefined) {
      updatePromises.push(updateHotelRooms(id, relatedData.rooms));
    }
    if (
      relatedData.imageUrls !== undefined &&
      Array.isArray(relatedData.imageUrls) &&
      relatedData.imageUrls.length > 0
    ) {
      updatePromises.push(saveHotelImageUrls(id, relatedData.imageUrls));
    }
    if (relatedData.reviewAggregates !== undefined) {
      updatePromises.push(updateHotelReviewAggregates(id, relatedData.reviewAggregates));
    }

    if (updatePromises.length > 0) {
      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some related updates failed:', failures);
        return {
          data: updatedHotel,
          error: 'Hotel updated but some related data failed to update',
        };
      }
    }

    return { data: updatedHotel, error: null };
  } catch (error) {
    console.error('Error in complete hotel update:', error.message || error);
    return { data: null, error: error.message || 'Failed to update hotel' };
  }
}
