import supabase from '../supabase/client';

/**
 * Fetch all property types (active only for dropdowns)
 * @param {boolean} activeOnly - If true, returns only active records
 * @returns {Promise<Array>} Array of property types
 */
export async function getTypes(activeOnly = false) {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return { data: null, error: 'Supabase not configured' };
    }

    let query = supabase
      .from('property_types')
      .select('id, name_en, name_ar, status, created_at, updated_at')
      .order('name_en', { ascending: true });

    // Filter for active only if requested
    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching property types:', error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching property types:', error.message || error);
    return { data: null, error: error.message || 'Failed to fetch property types' };
  }
}

/**
 * Create a new property type
 * @param {Object} typeData - Property type data
 * @returns {Promise<Object>} Created property type
 */
export async function createType(typeData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('property_types')
      .insert([typeData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating property type:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating property type:', error.message || error);
    return { data: null, error: error.message || 'Failed to create property type' };
  }
}

/**
 * Update a property type
 * @param {number} id - Property type ID
 * @param {Object} typeData - Updated property type data
 * @returns {Promise<Object>} Updated property type
 */
export async function updateType(id, typeData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('property_types')
      .update(typeData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating property type:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating property type:', error.message || error);
    return { data: null, error: error.message || 'Failed to update property type' };
  }
}

/**
 * Delete a property type
 * @param {number} id - Property type ID
 * @returns {Promise<Object>} Result
 */
export async function deleteType(id) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    const { error } = await supabase.from('property_types').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting property type:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting property type:', error.message || error);
    return { error: error.message || 'Failed to delete property type' };
  }
}

/**
 * Fetch all hotel chains (active only for dropdowns)
 * @param {boolean} activeOnly - If true, returns only active records
 * @returns {Promise<Array>} Array of chains
 */
export async function getChains(activeOnly = false) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    let query = supabase
      .from('chains')
      .select('id, name_en, name_ar, status, created_at, updated_at')
      .order('name_en', { ascending: true });

    // Filter for active only if requested
    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching chains:', error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching chains:', error.message || error);
    return { data: null, error: error.message || 'Failed to fetch chains' };
  }
}

/**
 * Create a new chain
 * @param {Object} chainData - Chain data
 * @returns {Promise<Object>} Created chain
 */
export async function createChain(chainData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('chains')
      .insert([chainData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating chain:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating chain:', error.message || error);
    return { data: null, error: error.message || 'Failed to create chain' };
  }
}

/**
 * Update a chain
 * @param {number} id - Chain ID
 * @param {Object} chainData - Updated chain data
 * @returns {Promise<Object>} Updated chain
 */
export async function updateChain(id, chainData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('chains')
      .update(chainData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating chain:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating chain:', error.message || error);
    return { data: null, error: error.message || 'Failed to update chain' };
  }
}

/**
 * Delete a chain
 * @param {number} id - Chain ID
 * @returns {Promise<Object>} Result
 */
export async function deleteChain(id) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    const { error } = await supabase.from('chains').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting chain:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting chain:', error.message || error);
    return { error: error.message || 'Failed to delete chain' };
  }
}

/**
 * Fetch all areas (active only for dropdowns)
 * @param {boolean} activeOnly - If true, returns only active records
 * @returns {Promise<Array>} Array of areas
 */
export async function getAreas(activeOnly = false) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    let query = supabase
      .from('areas')
      .select('id, name_en, name_ar, status, created_at, updated_at')
      .order('name_en', { ascending: true });

    // Filter for active only if requested
    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching areas:', error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching areas:', error.message || error);
    return { data: null, error: error.message || 'Failed to fetch areas' };
  }
}

/**
 * Create a new area
 * @param {Object} areaData - Area data
 * @returns {Promise<Object>} Created area
 */
export async function createArea(areaData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('areas')
      .insert([areaData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating area:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating area:', error.message || error);
    return { data: null, error: error.message || 'Failed to create area' };
  }
}

/**
 * Update an area
 * @param {number} id - Area ID
 * @param {Object} areaData - Updated area data
 * @returns {Promise<Object>} Updated area
 */
export async function updateArea(id, areaData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('areas')
      .update(areaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating area:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating area:', error.message || error);
    return { data: null, error: error.message || 'Failed to update area' };
  }
}

/**
 * Delete an area
 * @param {number} id - Area ID
 * @returns {Promise<Object>} Result
 */
export async function deleteArea(id) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    const { error } = await supabase.from('areas').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting area:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting area:', error.message || error);
    return { error: error.message || 'Failed to delete area' };
  }
}

// ============================================
// AMENITIES
// ============================================

/**
 * Fetch all amenities (active only for dropdowns)
 * @param {boolean} activeOnly - If true, returns only active records
 * @returns {Promise<Array>} Array of amenities
 */
export async function getAmenities(activeOnly = false) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    let query = supabase
      .from('amenities')
      .select('id, name_en, name_ar, icon, status, created_at, updated_at')
      .order('name_en', { ascending: true });

    // Filter for active only if requested
    if (activeOnly) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching amenities:', error);
      throw error;
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching amenities:', error.message || error);
    return { data: null, error: error.message || 'Failed to fetch amenities' };
  }
}

/**
 * Create a new amenity
 * @param {Object} amenityData - Amenity data
 * @returns {Promise<Object>} Created amenity
 */
export async function createAmenity(amenityData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('amenities')
      .insert([amenityData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating amenity:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating amenity:', error.message || error);
    return { data: null, error: error.message || 'Failed to create amenity' };
  }
}

/**
 * Update an amenity
 * @param {number} id - Amenity ID
 * @param {Object} amenityData - Updated amenity data
 * @returns {Promise<Object>} Updated amenity
 */
export async function updateAmenity(id, amenityData) {
  try {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('amenities')
      .update(amenityData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating amenity:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating amenity:', error.message || error);
    return { data: null, error: error.message || 'Failed to update amenity' };
  }
}

/**
 * Delete an amenity
 * @param {number} id - Amenity ID
 * @returns {Promise<Object>} Result
 */
export async function deleteAmenity(id) {
  try {
    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    const { error } = await supabase.from('amenities').delete().eq('id', id);

    if (error) {
      console.error('Supabase error deleting amenity:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting amenity:', error.message || error);
    return { error: error.message || 'Failed to delete amenity' };
  }
}
