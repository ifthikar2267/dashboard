'use client';

import { useState } from 'react';
import { Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function ImageUrlInput({ imageUrls = [], onChange }) {
  const [urls, setUrls] = useState(imageUrls);
  const [newUrl, setNewUrl] = useState('');

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    if (!isValidUrl(newUrl)) {
      toast.error('Please enter a valid URL');
      return;
    }

    const updatedUrls = [...urls, newUrl.trim()];
    setUrls(updatedUrls);
    onChange(updatedUrls);
    setNewUrl('');
    toast.success('Image URL added');
  };

  const handleRemoveUrl = (index) => {
    const updatedUrls = urls.filter((_, i) => i !== index);
    setUrls(updatedUrls);
    onChange(updatedUrls);
    toast.success('Image URL removed');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Image URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Add fontSize="small" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter full image URL (e.g., from Unsplash, Pexels, or your CDN)
        </p>
      </div>

      {/* Image URL List */}
      {urls.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Image URLs ({urls.length})
          </label>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {urls.map((url, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                {/* Image Preview */}
                <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-xs">Invalid</span></div>';
                    }}
                  />
                </div>

                {/* URL Display */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Primary
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Image {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate" title={url}>
                    {url}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove"
                >
                  <Delete fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {urls.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="mx-auto text-gray-400 mb-2" style={{ fontSize: 48 }} />
          <p className="text-sm text-gray-500">No images added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add image URLs using the input above
          </p>
        </div>
      )}
    </div>
  );
}
