// Inside app/layout.tsx
import './globals.css';
import NavBar from "@/components/NavBar";
import { Web3Provider } from "@/context/Web3Context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <NavBar /> {/* <--- Add it here */}
          <main>{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}