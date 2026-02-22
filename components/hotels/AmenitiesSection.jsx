'use client';

import { useState, useEffect } from 'react';
import { Add, Delete } from '@mui/icons-material';
import { getAmenities } from '@/lib/services/masterData.service';

export default function AmenitiesSection({ selectedAmenities = [], onChange }) {
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      // Fetch only active amenities for selection
      const { data, error } = await getAmenities(true);
      setAvailableAmenities(data || []);
    } catch (err) {
      console.error('Error loading amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (amenityId) => {
    const isSelected = selectedAmenities.includes(amenityId);
    
    if (isSelected) {
      onChange(selectedAmenities.filter(id => id !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  const handleSelectAll = () => {
    onChange(availableAmenities.map(a => a.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-500 mt-2">Loading amenities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedAmenities.length} of {availableAmenities.length} selected
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Amenities Grid */}
      {availableAmenities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableAmenities.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity.id);
            
            return (
              <label
                key={amenity.id}
                className={`
                  flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(amenity.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {amenity.name_en}
                  </p>
                  <p className="text-xs text-gray-500">
                    {amenity.name_ar}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No amenities available. Please add amenities in Master Data.
        </p>
      )}
    </div>
  );
}
