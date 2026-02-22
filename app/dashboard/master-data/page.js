'use client';

import { useState, useEffect } from 'react';
import { Edit, Delete, Close } from '@mui/icons-material';
import toast, { Toaster } from 'react-hot-toast';
import {
  getTypes, createType, updateType, deleteType,
  getChains, createChain, updateChain, deleteChain,
  getAreas, createArea, updateArea, deleteArea,
  getAmenities, createAmenity, updateAmenity, deleteAmenity,
} from '@/lib/services/masterData.service';

// Mock data for fallback
const mockTypes = [
  { id: 101, name_en: 'Hotel', name_ar: 'فندق', status: 'active' },
  { id: 201, name_en: 'Apartment', name_ar: 'شقة', status: 'active' },
  { id: 301, name_en: 'Resort', name_ar: 'منتجع', status: 'active' },
];

const mockChains = [
  { id: 100, name_en: 'Marriott International', name_ar: 'ماريوت الدولية', status: 'active' },
  { id: 200, name_en: 'Hilton Worldwide', name_ar: 'هيلتون العالمية', status: 'active' },
  { id: 300, name_en: 'Hyatt Hotels', name_ar: 'فنادق حياة', status: 'active' },
];

const mockAreas = [
  { id: 102, name_en: 'Downtown Dubai', name_ar: 'وسط مدينة دبي', status: 'active' },
  { id: 202, name_en: 'Dubai Marina', name_ar: 'دبي مارينا', status: 'active' },
  { id: 302, name_en: 'Jumeirah Beach', name_ar: 'شاطئ جميرا', status: 'active' },
];

const mockAmenities = [
  { id: 103, name_en: 'Gym/Fitness Centre', name_ar: 'نادي رياضي', status: 'active' },
  { id: 203, name_en: 'Swimming Pool', name_ar: 'مسبح', status: 'active' },
  { id: 303, name_en: 'Sauna', name_ar: 'ساونا', status: 'active' },
  { id: 403, name_en: 'Spa', name_ar: 'سبا', status: 'active' },
];

const tabs = [
  { id: 'types', label: 'Types' },
  { id: 'chains', label: 'Chains' },
  { id: 'areas', label: 'Areas' },
  { id: 'amenities', label: 'Amenities' },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('types');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name_en: '', name_ar: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'types':
          result = await getTypes();
          setData(result.error ? mockTypes : result.data || mockTypes);
          break;
        case 'chains':
          result = await getChains();
          setData(result.error ? mockChains : result.data || mockChains);
          break;
        case 'areas':
          result = await getAreas();
          setData(result.error ? mockAreas : result.data || mockAreas);
          break;
        case 'amenities':
          result = await getAmenities();
          setData(result.error ? mockAmenities : result.data || mockAmenities);
          break;
        default:
          setData([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name_en: '', name_ar: '', status: 'active' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name_en: item.name_en || '', name_ar: item.name_ar || '', status: item.status || 'active' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name_en || !formData.name_ar) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      
      if (editingItem) {
        // Update existing item
        switch (activeTab) {
          case 'types':
            result = await updateType(editingItem.id, formData);
            break;
          case 'chains':
            result = await updateChain(editingItem.id, formData);
            break;
          case 'areas':
            result = await updateArea(editingItem.id, formData);
            break;
          case 'amenities':
            result = await updateAmenity(editingItem.id, formData);
            break;
        }
        
        if (result.error) {
          toast.error('Failed to update: ' + result.error);
        } else {
          toast.success('Updated successfully');
          setShowModal(false);
          loadData(); // Refresh list
        }
      } else {
        // Create new item
        switch (activeTab) {
          case 'types':
            result = await createType(formData);
            break;
          case 'chains':
            result = await createChain(formData);
            break;
          case 'areas':
            result = await createArea(formData);
            break;
          case 'amenities':
            result = await createAmenity(formData);
            break;
        }
        
        if (result.error) {
          toast.error('Failed to create: ' + result.error);
        } else {
          toast.success('Created successfully');
          setShowModal(false);
          loadData(); // Refresh list
        }
      }
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    setDeleting(id);
    try {
      let result;
      
      switch (activeTab) {
        case 'types':
          result = await deleteType(id);
          break;
        case 'chains':
          result = await deleteChain(id);
          break;
        case 'areas':
          result = await deleteArea(id);
          break;
        case 'amenities':
          result = await deleteAmenity(id);
          break;
      }
      
      if (result.error) {
        toast.error('Failed to delete: ' + result.error);
      } else {
        toast.success('Deleted successfully');
        setData(data.filter(item => item.id !== id)); // Update local state
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getButtonLabel = () => {
    const labels = {
      types: 'Add Type',
      chains: 'Add Chain',
      areas: 'Add Area',
      amenities: 'Add Amenity',
    };
    return labels[activeTab] || 'Add';
  };

  const getNameField = (item) => {
    return item.name_en;
  };

  const getNameArField = (item) => {
    return item.name_ar;
  };

  const filteredData = data.filter((item) => {
    const nameEn = getNameField(item)?.toLowerCase() || '';
    const nameAr = getNameArField(item)?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return nameEn.includes(search) || nameAr.includes(search);
  });

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
        <p className="text-gray-600 mt-1">
          Manage types, chains, areas, and amenities
        </p>
      </div>

      {/* Master Data Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm('');
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-gray-300 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + {getButtonLabel()}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading...</p>
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name (EN)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name (AR)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getNameField(item)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getNameArField(item)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                              title="Edit"
                              disabled={deleting === item.id}
                            >
                              <Edit fontSize="small" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 disabled:opacity-50"
                              title="Delete"
                              disabled={deleting === item.id}
                            >
                              {deleting === item.id ? (
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
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        {searchTerm
                          ? `No ${activeTab} found matching "${searchTerm}"`
                          : `No ${activeTab} available. Click "${getButtonLabel()}" to create your first entry.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Close />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (Arabic) *
                </label>
                <input
                  type="text"
                  value={formData.name_ar || ''}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
