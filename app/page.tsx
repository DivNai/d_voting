"use client";
import { useState } from "react";
import LoginCard from "@/components/LoginCard";
import AdminPortal from "@/components/AdminPortal";
import VotingPage from "@/components/VotingPage";

export default function Page() {
  const [userRole, setUserRole] = useState<string | null>(null);

  if (!userRole) {
    return <LoginCard onLogin={(role) => setUserRole(role)} />;
  }

  return (
    <main>
      {userRole === 'admin' ? <AdminPortal /> : <VotingPage />}
    </main>
  );
}