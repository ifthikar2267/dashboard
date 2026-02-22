'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
        {/* Header - Fixed at top of content */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
