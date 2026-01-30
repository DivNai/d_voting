"use client";
import React, { useEffect } from 'react';
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import AdminPortal from "@/components/AdminPortal";

const AdminPage = () => {
  const { userInfo, loading } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    // If loading is done and there is no admin role, kick them out
    if (!loading && (!userInfo || userInfo.role !== 'admin')) {
      console.log("Access Denied. User Info:", userInfo);
      router.push("/");
    }
  }, [userInfo, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500 font-mono">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mb-4"></div>
        DEBUG: Verifying Admin Session...
      </div>
    </div>);
  
  if (!userInfo) return <div className="min-h-screen bg-slate-900 text-red-500 p-10 font-mono">DEBUG: No User Found. Redirecting...</div>;

  if (userInfo.role !== 'admin') return <div className="min-h-screen bg-slate-900 text-amber-500 p-10 font-mono">DEBUG: Role is {userInfo.role}, not admin. Redirecting...</div>;

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminPortal />
    </div>
  );
};

export default AdminPage;