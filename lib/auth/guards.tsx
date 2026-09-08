"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "./context";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("ADMIN" | "COORDINATOR")[];
  fallbackUrl?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackUrl = "/login",
}) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackUrl);
      } else if (role && !allowedRoles.includes(role as "ADMIN" | "COORDINATOR")) {
        // Redirect unauthorized users to their own dashboard or login
        if (role === "COORDINATOR") router.push("/coordinator");
        else if (role === "ADMIN") router.push("/admin");
        else router.push(fallbackUrl);
      }
    }
  }, [user, role, loading, allowedRoles, fallbackUrl, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-slate-400 font-medium">Verifying authorization credentials...</p>
      </div>
    );
  }

  if (!user || (role && !allowedRoles.includes(role as "ADMIN" | "COORDINATOR"))) {
    return null;
  }

  return <>{children}</>;
};
