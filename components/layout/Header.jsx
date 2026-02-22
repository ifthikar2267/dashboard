'use client';

import { usePathname } from 'next/navigation';
import { Menu } from '@mui/icons-material';

// Map routes to page titles
const pageTitles = {
  '/dashboard/hotels': 'Hotels',
  '/dashboard/hotels/add': 'Add Hotel',
  '/dashboard/master-data': 'Master Data',
};

export default function Header({ toggleSidebar }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Hotels';

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="text-gray-600" />
          </button>

          {/* Page Title */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-800">
              {pageTitle}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
