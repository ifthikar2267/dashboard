'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hotel,
  AddBusiness,
  Storage,
  ChevronLeft,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

const menuItems = [
  {
    label: 'Properties',
    icon: Hotel,
    path: '/dashboard/hotels',
  },
  {
    label: 'Add Property',
    icon: AddBusiness,
    path: '/dashboard/hotels/add',
  },
  {
    label: 'Master Data',
    icon: Storage,
    path: '/dashboard/master-data',
  },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname();

  const isActive = (path) => {
    return pathname?.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Hotel className="text-blue-600" fontSize="small" />
            </div>
            <div>
              <span className="font-bold text-base text-white block leading-tight">
                Stay
              </span>
              <span className="text-xs text-blue-100">Dashboard</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-blue-800/30 text-white transition-colors"
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  // Close sidebar on mobile when clicking a link
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon 
                  className={active ? 'text-blue-600' : 'text-gray-500'} 
                  fontSize="small"
                />
                <span className="text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
