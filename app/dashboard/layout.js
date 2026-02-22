import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'Hotel Admin Dashboard',
  description: 'Hotel management admin dashboard',
};

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
