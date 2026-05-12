'use client';
import AdminPortal from '@/components/AdminPortal';

// Route-level protection is handled by middleware.ts
export default function AdminPage() {
  return <AdminPortal />;
}