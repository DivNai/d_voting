"use client"; // Required because we are using context hooks and dynamic background props

import './globals.css';
import NavBar from "@/components/NavBar";
import { Web3Provider, useWeb3 } from "@/context/Web3Context";
import DarkVeil from '@/components/DarkVeil';
import { Toaster } from 'react-hot-toast';

// A small inner wrapper to access Web3 state for the background pulse
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isTransacting } = useWeb3();

  return (
    <>
      {/* BACKGROUND LAYER - Reacts to blockchain transactions */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DarkVeil
          hueShift={isTransacting ? 210 : 31} // Shifts from Emerald to Deep Blue during pulse
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={isTransacting ? 3.0 : 0.5}   // Speeds up during transaction
          scanlineFrequency={0}
          warpAmount={isTransacting ? 0.2 : 0} // Adds slight distortion during pulse
        />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10">
        <NavBar />
        <main className="relative z-10 pt-10 min-h-screen"> 
          {/* Increased pt-10 to pt-32 to prevent NavBar overlap */}
          {children}
        </main>
      </div>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white antialiased relative min-h-screen">
        <Web3Provider>
          {/* TOASTER CONFIGURATION */}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'font-mono text-xs uppercase tracking-widest border border-white/10 backdrop-blur-xl',
              style: {
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
            }}
          />
          
          <LayoutContent>
            {children}
          </LayoutContent>
        </Web3Provider>
      </body>
    </html>
  );
}