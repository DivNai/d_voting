'use client';

import { Web3Provider } from '@/context/Web3Context';
import NavBar from '@/components/NavBar';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: '#ffffff',
            color: '#0a1929',
            border: '1px solid #e8eef5',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '13px',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(10,25,41,.09)',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
      <NavBar />
      <main className="min-h-screen bg-[#f0f4f8]">
        {children}
      </main>
    </Web3Provider>
  );
}