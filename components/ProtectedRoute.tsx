"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userInfo, loading } = useWeb3();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // 1. If not logged in at all, go to login
      if (!userInfo) {
        router.push("/");
      } 
      // 2. If trying to access /admin but the role isn't 'admin'
      else if (pathname.startsWith('/admin') && userInfo.role !== 'admin') {
        console.warn("Access Denied: Not an admin");
        router.push('/account'); // Send them to their own profile instead
      }
    }
  }, [userInfo, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500 font-mono">
        Verifying Permissions...
      </div>
    );
  }

  return userInfo ? <>{children}</> : null;
};

export default ProtectedRoute;