'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import { getHotels, deleteHotel } from '@/lib/services/hotels.service';

export default function HotelsPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load hotels on mount
  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await getHotels();
      
      if (error) {
        toast.error('Failed to load hotels. Using mock data.');
        // Mock data fallback
        setHotels([
          { id: 1000, name_en: 'Hyde Hotel Dubai', name_ar: 'فندق هايد دبي', 
            area: { name_en: 'Downtown Dubai' }, type: { name_en: 'Hotel' }, 
            status: 'active', star_rating: 5 },
          { id: 2000, name_en: 'JA Ocean View Hotel', name_ar: 'فندق جيه ايه أوشن فيو',
            area: { name_en: 'Jumeirah Beach' }, type: { name_en: 'Hotel' },
            status: 'active', star_rating: 4 },
          { id: 3000, name_en: 'SLS Dubai Hotel', name_ar: 'فندق إس إل إس دبي',
            area: { name_en: 'Dubai Marina' }, type: { name_en: 'Hotel' },
            status: 'active', star_rating: 5 },
        ]);
      } else {
        setHotels(data || []);
      }
    } catch (err) {
      console.error('Error loading hotels:', err);
      toast.error('Failed to load hotels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter hotels based on search term
  const filteredHotels = hotels.filter((hotel) =>
    hotel.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.area?.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHotels = filteredHotels.slice(startIndex, endIndex);

  const handleEdit = (id) => {
    router.push(`/dashboard/hotels/${id}/edit`);
  };

  const handleDelete = async (id) => {
    // Show custom confirmation
    const hotelToDelete = hotels.find(h => h.id === id);
    const hotelName = hotelToDelete?.name_en || 'this hotel';
    
    if (!confirm(`Are you sure you want to delete "${hotelName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const { error } = await deleteHotel(id);
      
      if (error) {
        toast.error(`Failed to delete hotel: ${error}`);
      } else {
        toast.success(`"${hotelName}" deleted successfully`);
        // Remove from local state
        setHotels(hotels.filter(h => h.id !== id));
      }
    } catch (err) {
      console.error('Error deleting hotel:', err);
      toast.error('Failed to delete hotel');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = (id) => {
    router.push(`/dashboard/hotels/${id}`);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-gray-600 mt-1">
            Manage your hotel listings
          </p>
        </div>
        <Link
          href="/dashboard/hotels/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          + Add Hotel
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search hotels by name or area..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading hotels...</p>
          </div>
        </div>
      )}

      {/* Hotels Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentHotels.length > 0 ? (
                  currentHotels.map((hotel) => (
                    <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Hotel Image - prioritize thumbnail_url, then image_url */}
                          <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-100">
                            {(hotel.thumbnail_url || hotel.image_url) ? (
                              <img
                                src={hotel.thumbnail_url || hotel.image_url}
                                alt={hotel.name_en}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/48?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          
                          {/* Hotel Name */}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {hotel.name_en}
                            </div>
                            <div className="text-sm text-gray-500">{hotel.name_ar}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {hotel.area?.name_en || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {hotel.type?.name_en || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            hotel.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {hotel.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {hotel.star_rating || 'N/A'}
                          </span>
                          {hotel.star_rating && (
                            <span className="ml-1 text-yellow-500">⭐</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(hotel.id)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                            title="View"
                          >
                            <Visibility fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleEdit(hotel.id)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1"
                            title="Edit"
                            disabled={deleting === hotel.id}
                          >
                            <Edit fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleDelete(hotel.id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 disabled:opacity-50"
                            title="Delete"
                            disabled={deleting === hotel.id}
                          >
                            {deleting === hotel.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Delete fontSize="small" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No hotels found matching your search.' : 'No hotels found. Click "Add Hotel" to create your first hotel.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredHotels.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {filteredHotels.length > 0 ? startIndex + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredHotels.length)}
                </span>{' '}
                of <span className="font-medium">{filteredHotels.length}</span>{' '}
                results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                        currentPage === index + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
