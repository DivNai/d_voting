"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import LoginCard from "@/components/LoginCard";

export default function Page() {
  const { userInfo, loading } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    // If user data is loaded and a user exists, redirect them away from login
    if (!loading && userInfo) {
    // If we have a user, get them OFF the login page immediately
    const target = userInfo.role === 'admin' ? '/admin' : '/account';
    router.push(target);
    }
  }, [userInfo, loading, router]);

  // While checking the blockchain/supabase session, show a loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-emerald-500 font-mono animate-pulse">Syncing with Blockchain...</p>
      </div>
    );
  }

  // If no one is logged in, show the LoginCard
  // We pass a dummy function to onLogin because the useEffect above handles the redirect
  return <LoginCard onLogin={() => {}} />;
}