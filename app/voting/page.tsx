"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import VotingPage from "@/components/VotingPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <VotingPage />
    </ProtectedRoute>
  );
}