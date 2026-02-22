'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getHotelComplete } from '@/lib/services/hotels.service';
import { getAmenities } from '@/lib/services/masterData.service';
import { ArrowBack, Edit, LocationOn, Star, Phone, Email, Language, Hotel as HotelIcon, AttachMoney } from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';

export default function ViewHotelPage() {
  const router = useRouter();
  const params = useParams();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allAmenities, setAllAmenities] = useState([]);

  useEffect(() => {
    loadHotel();
  }, [params.id]);

  const loadHotel = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      
      // Load hotel and amenities in parallel
      const [hotelResult, amenitiesResult] = await Promise.all([
        getHotelComplete(params.id),
        getAmenities(),
      ]);
      
      if (hotelResult.error || !hotelResult.data) {
        console.error('Error fetching hotel:', hotelResult.error);
        setNotFound(true);
        toast.error('Hotel not found');
      } else {
        setHotel(hotelResult.data);
        setAllAmenities(amenitiesResult.data || []);
        console.log('Loaded complete hotel data:', hotelResult.data);
      }
    } catch (err) {
      console.error('Error loading hotel:', err);
      setNotFound(true);
      toast.error('Failed to load hotel');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading hotel details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !hotel) {
    return (
      <div className="space-y-6">
        <Toaster position="top-right" />
        
        {/* Header */}
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
              <p className="text-gray-600 mt-1">The hotel you're looking for doesn't exist</p>
            </div>
          </div>
        </div>

        {/* Not Found Card */}
        <div className="bg-white rounded-lg shadow p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Hotel Not Found</h2>
            <p className="text-gray-600 mb-6">
              The hotel with ID "{params.id}" doesn't exist or has been deleted.
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/hotels')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowBack />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hotel.name_en}</h1>
            <p className="text-gray-600 mt-1">{hotel.name_ar}</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/dashboard/hotels/${params.id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit fontSize="small" />
          Edit Hotel
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail Image */}
          {(hotel.thumbnail_url || hotel.image_url) && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={hotel.thumbnail_url || hotel.image_url}
                alt={hotel.name_en}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div className="space-y-4">
              {hotel.description_en && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">English</p>
                  <p className="text-gray-600">{hotel.description_en}</p>
                </div>
              )}
              {hotel.description_ar && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Arabic</p>
                  <p className="text-gray-600" dir="rtl">{hotel.description_ar}</p>
                </div>
              )}
              {!hotel.description_en && !hotel.description_ar && (
                <p className="text-gray-400 text-sm">No description available</p>
              )}
            </div>
          </div>

          {/* Address */}
          {(hotel.address_en || hotel.address_ar) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
              <div className="space-y-3">
                {hotel.address_en && (
                  <div className="flex items-start gap-2">
                    <LocationOn className="text-gray-400 mt-0.5" fontSize="small" />
                    <p className="text-gray-600">{hotel.address_en}</p>
                  </div>
                )}
                {hotel.address_ar && (
                  <div className="flex items-start gap-2" dir="rtl">
                    <LocationOn className="text-gray-400 mt-0.5" fontSize="small" />
                    <p className="text-gray-600">{hotel.address_ar}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Amenities & Facilities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hotel.amenities.map((amenityId) => {
                  const amenity = allAmenities.find(a => a.id === amenityId);
                  return amenity ? (
                    <div key={amenityId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full flex-shrink-0">
                        <span className="text-blue-600 font-semibold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{amenity.name_en}</p>
                        <p className="text-xs text-gray-500" dir="rtl">{amenity.name_ar}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Rooms & Pricing */}
          {hotel.rooms && hotel.rooms.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rooms & Pricing
              </h2>
              <div className="space-y-6">
                {hotel.rooms.map((room, index) => {
                  const roomTitle = [room.room_type, room.bedding, room.view].filter(Boolean).length
                    ? `${room.room_type || ''} - ${room.bedding || ''} (${room.view || ''})`
                    : 'Room';
                  const images = Array.isArray(room.images) ? room.images.filter((u) => typeof u === 'string' && u.trim()) : [];
                  const packages = Array.isArray(room.packages) ? room.packages : [];
                  return (
                    <div key={room.id || index} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                      <div className="flex items-start gap-4 flex-1 mb-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg flex-shrink-0">
                          <HotelIcon className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {roomTitle}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                            {room.room_type && (
                              <span><span className="text-gray-500">Category:</span> {room.room_type}</span>
                            )}
                            {room.bedding && (
                              <span><span className="text-gray-500">Bedding:</span> {room.bedding}</span>
                            )}
                            {room.view && (
                              <span><span className="text-gray-500">View:</span> {room.view}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {images.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Images</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((url, imgIdx) => (
                              <div
                                key={`${room.id}-${imgIdx}`}
                                className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                                style={{ paddingTop: '75%' }}
                              >
                                <img
                                  src={url}
                                  alt={`${roomTitle} ${imgIdx + 1}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {packages.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Packages & prices</p>
                          <div className="space-y-3">
                            {packages.map((pkg, pkgIdx) => (
                              <div
                                key={pkg.id || pkgIdx}
                                className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex items-center gap-1 text-blue-600 font-bold text-xl">
                                  <AttachMoney fontSize="medium" />
                                  <span>{Number(pkg.first_price) ?? 0}</span>
                                </div>
                                <span className="text-gray-500 text-sm">First price</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-700 font-medium">{Number(pkg.base_price) ?? 0}</span>
                                <span className="text-gray-500 text-sm">Base price</span>
                                {(pkg.meal_board || pkg.cancellation_policy) && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600 text-sm">
                                      {[pkg.meal_board, pkg.cancellation_policy].filter(Boolean).join(' · ')}
                                    </span>
                                  </>
                                )}
                                <div className="w-full flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                  <span>Almosafer: <strong>{Number(pkg.almosafer_points) ?? 0}</strong></span>
                                  <span>Shukran: <strong>{Number(pkg.shukran_points) ?? 0}</strong></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No packages for this room.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Rooms & Pricing
              </h2>
              <div className="text-center py-8">
                <HotelIcon className="text-gray-300 mx-auto" style={{ fontSize: 48 }} />
                <p className="text-gray-500 mt-2">No rooms available</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details Card */}
        <div className="space-y-6">
          {/* Hotel Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h2>
            <div className="space-y-4">
              {/* Type */}
              {hotel.type && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="text-gray-900 font-medium">{hotel.type.name_en}</p>
                </div>
              )}

              {/* Chain */}
              {hotel.chain && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chain</p>
                  <p className="text-gray-900 font-medium">{hotel.chain.name_en}</p>
                </div>
              )}

              {/* Area */}
              {hotel.area && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Area</p>
                  <p className="text-gray-900 font-medium">{hotel.area.name_en}</p>
                </div>
              )}

              {/* Star Rating */}
              {hotel.star_rating && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Star Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-500" fontSize="small" />
                    <span className="text-gray-900 font-medium">{hotel.star_rating} Stars</span>
                  </div>
                </div>
              )}

              {/* Rank */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Rank</p>
                <p className="text-gray-900 font-medium">{hotel.rank || 0}</p>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  hotel.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {hotel.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          {(hotel.phone || hotel.email || hotel.website) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                {hotel.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="text-gray-400" fontSize="small" />
                    <a href={`tel:${hotel.phone}`} className="text-blue-600 hover:underline">
                      {hotel.phone}
                    </a>
                  </div>
                )}
                {hotel.email && (
                  <div className="flex items-center gap-2">
                    <Email className="text-gray-400" fontSize="small" />
                    <a href={`mailto:${hotel.email}`} className="text-blue-600 hover:underline">
                      {hotel.email}
                    </a>
                  </div>
                )}
                {hotel.website && (
                  <div className="flex items-center gap-2">
                    <Language className="text-gray-400" fontSize="small" />
                    <a 
                      href={hotel.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}