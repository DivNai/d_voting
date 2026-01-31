// Inside app/layout.tsx
import './globals.css';
import NavBar from "@/components/NavBar";
import { Web3Provider } from "@/context/Web3Context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <Web3Provider>
          <NavBar />
          {/* pt-24: Adds top padding so content starts below the fixed NavBar
              min-h-screen: Ensures the background covers the full page
          */}
          <main className="pt-24 min-h-screen px-4 md:px-8">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}