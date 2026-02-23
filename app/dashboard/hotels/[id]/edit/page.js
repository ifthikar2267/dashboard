'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { getHotelComplete, updateHotelComplete } from '@/lib/services/hotels.service';
import { getTypes, getChains, getAreas } from '@/lib/services/masterData.service';
import { ArrowBack } from '@mui/icons-material';
import AmenitiesSection from '@/components/hotels/AmenitiesSection';
import RoomsSection from '@/components/hotels/RoomsSection';
import ImageUrlInput from '@/components/hotels/ImageUrlInput';
import ReviewAggregatesSection from '@/components/hotels/ReviewAggregatesSection';

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    type_id: '',
    chain_id: '',
    area_id: '',
    address_en: '',
    address_ar: '',
    star_rating: '',
    rank: 0,
    description_en: '',
    description_ar: '',
    thumbnail_url: '',
    status: 'active',
  });

  // Related data
  const [amenities, setAmenities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [reviewAggregates, setReviewAggregates] = useState([]);

  // Master data
  const [types, setTypes] = useState([]);
  const [chains, setChains] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load master data and hotel in parallel
      const [typesResult, chainsResult, areasResult, hotelResult] = await Promise.all([
        getTypes(true),
        getChains(true),
        getAreas(true),
        getHotelComplete(params.id),
      ]);

      setTypes(typesResult.data || []);
      setChains(chainsResult.data || []);
      setAreas(areasResult.data || []);

      if (hotelResult.error || !hotelResult.data) {
        setNotFound(true);
        toast.error('Hotel not found');
      } else {
        const hotel = hotelResult.data;
        
        // Populate form with existing data
        setFormData({
          name_en: hotel.name_en || '',
          name_ar: hotel.name_ar || '',
          type_id: hotel.type_id || '',
          chain_id: hotel.chain_id || '',
          area_id: hotel.area_id || '',
          address_en: hotel.address_en || '',
          address_ar: hotel.address_ar || '',
          star_rating: hotel.star_rating || '',
          rank: hotel.rank || 0,
          description_en: hotel.description_en || '',
          description_ar: hotel.description_ar || '',
          thumbnail_url: hotel.thumbnail_url || '',
          status: hotel.status || 'active',
        });

        // Load related data
        setAmenities(hotel.amenities || []);
        setRooms(hotel.rooms || []);
        
        // Load images from images JSONB column or image_url
        const images = [];
        if (hotel.images && Array.isArray(hotel.images)) {
          images.push(...hotel.images);
        } else if (hotel.image_url) {
          images.push(hotel.image_url);
        }
        setImageUrls(images);

        const aggregates = (hotel.review_aggregates || []).map((r) => ({
          id: r.id,
          average_rating: r.average_rating ?? '',
          total_reviews: r.total_reviews ?? '',
        }));
        setReviewAggregates(aggregates);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load hotel data');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name_en || !formData.name_ar) {
      toast.error('Please fill in hotel name in both languages');
      return false;
    }

    if (!formData.type_id || !formData.area_id) {
      toast.error('Please select type and area');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    
    try {
      // Convert string values to numbers for foreign keys
      const hotelData = {
        ...formData,
        type_id: parseInt(formData.type_id),
        chain_id: formData.chain_id ? parseInt(formData.chain_id) : null,
        area_id: parseInt(formData.area_id),
        star_rating: formData.star_rating ? parseInt(formData.star_rating) : null,
        rank: parseInt(formData.rank) || 0,
      };

      const relatedData = {
        amenities,
        rooms,
        imageUrls,
        reviewAggregates,
      };

      console.log('Updating hotel with complete data:', { hotelData, relatedData });

      const { data, error } = await updateHotelComplete(params.id, hotelData, relatedData);

      if (error) {
        toast.error('Failed to update hotel: ' + error);
        setSubmitting(false);
        return;
      }

      toast.success('Hotel updated successfully with all related data!');
      
      setTimeout(() => {
        router.push('/dashboard/hotels');
      }, 1000);
    } catch (err) {
      console.error('Error updating hotel:', err);
      toast.error('Failed to update hotel');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/hotels');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading hotel data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/hotels')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowBack />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hotel Not Found</h1>
              <p className="text-gray-600 mt-1">Cannot edit a hotel that doesn't exist</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Hotel Not Found</h2>
            <p className="text-gray-600 mb-6">
              The hotel you're trying to edit doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/dashboard/hotels')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Hotels List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/hotels')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowBack />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Hotel</h1>
          <p className="text-gray-600 mt-1">Update hotel information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">General Infor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Name (EN) *
                  </label>
                  <input
                    type="text"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    placeholder="Enter hotel name in English"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Name (AR) *
                  </label>
                  <input
                    type="text"
                    name="name_ar"
                    value={formData.name_ar}
                    onChange={handleChange}
                    placeholder="Enter hotel name in Arabic"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="rtl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select 
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  >
                    <option value="">Select type</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chain
                  </label>
                  <select 
                    name="chain_id"
                    value={formData.chain_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select chain (optional)</option>
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <select 
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  >
                    <option value="">Select area</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Star Rating
                  </label>
                  <select 
                    name="star_rating"
                    value={formData.star_rating}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select rating</option>
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rank
                  </label>
                  <input
                    type="number"
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (EN)
                  </label>
                  <input
                    type="text"
                    name="address_en"
                    value={formData.address_en}
                    onChange={handleChange}
                    placeholder="Enter address in English"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (AR)
                  </label>
                  <input
                    type="text"
                    name="address_ar"
                    value={formData.address_ar}
                    onChange={handleChange}
                    placeholder="Enter address in Arabic"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (EN)
                  </label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Enter hotel description in English"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (AR)
                  </label>
                  <textarea
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Enter hotel description in Arabic"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="rtl"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Enter a URL for the hotel thumbnail image
                  </p>
                  {formData.thumbnail_url && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={formData.thumbnail_url}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '';
                            e.target.alt = 'Invalid image URL';
                            e.target.className = 'w-full h-full flex items-center justify-center text-xs text-gray-400';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              <ImageUrlInput 
                urls={imageUrls} 
                onChange={setImageUrls}
              />
            </div>

            {/* Amenities Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <AmenitiesSection 
                selectedAmenities={amenities} 
                onChange={setAmenities}
              />
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
              <ReviewAggregatesSection
                reviews={reviewAggregates}
                onChange={setReviewAggregates}
              />
            </div>

            {/* Rooms Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rooms & Pricing</h2>
              <RoomsSection 
                rooms={rooms} 
                onChange={setRooms}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <button 
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
