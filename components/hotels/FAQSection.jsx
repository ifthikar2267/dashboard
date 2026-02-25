'use client';

import { Add, Delete } from '@mui/icons-material';

export default function FAQSection({ faqs, onChange }) {
  const handleAdd = () => {
    onChange([...faqs, { question_en: '', question_ar: '', answer_en: '', answer_ar: '' }]);
  };

  const handleRemove = (index) => {
    onChange(faqs.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = faqs.map((faq, i) => {
      if (i === index) {
        return { ...faq, [field]: value };
      }
      return faq;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Add fontSize="small" />
          Add FAQ
        </button>
      </div>

      {/* FAQ List */}
      {faqs.length > 0 ? (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1 cursor-pointer"
                title="Remove FAQ"
              >
                <Delete fontSize="small" />
              </button>

              <div className="space-y-3 pr-8">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  FAQ #{index + 1}
                </div>

                {/* Question EN */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Question (English)
                  </label>
                  <input
                    type="text"
                    value={faq.question_en}
                    onChange={(e) => handleChange(index, 'question_en', e.target.value)}
                    placeholder="Enter question in English"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Question AR */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Question (Arabic)
                  </label>
                  <input
                    type="text"
                    value={faq.question_ar}
                    onChange={(e) => handleChange(index, 'question_ar', e.target.value)}
                    placeholder="Enter question in Arabic"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="rtl"
                  />
                </div>

                {/* Answer EN */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Answer (English)
                  </label>
                  <textarea
                    value={faq.answer_en}
                    onChange={(e) => handleChange(index, 'answer_en', e.target.value)}
                    placeholder="Enter answer in English"
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Answer AR */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Answer (Arabic)
                  </label>
                  <textarea
                    value={faq.answer_ar}
                    onChange={(e) => handleChange(index, 'answer_ar', e.target.value)}
                    placeholder="Enter answer in Arabic"
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No FAQs added yet</p>
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add your first FAQ
          </button>
        </div>
      )}
    </div>
  );
}
