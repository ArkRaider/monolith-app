"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<{ totalUsers: number; totalRooms: number; activeRooms: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user || user.publicMetadata?.role !== "developer") {
      router.push("/dashboard");
      return;
    }

    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-zinc-400">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Developer Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Users</h2>
            <p className="text-4xl font-bold text-emerald-400">{stats?.totalUsers || 0}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Rooms</h2>
            <p className="text-4xl font-bold text-blue-400">{stats?.totalRooms || 0}</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Active Rooms</h2>
            <p className="text-4xl font-bold text-purple-400">{stats?.activeRooms || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
