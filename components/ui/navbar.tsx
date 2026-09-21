"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { 
  ShieldCheck, 
  Award, 
  Layers, 
  Users, 
  Mail, 
  LogOut, 
  LogIn, 
  Menu, 
  X, 
  ChevronRight,
  FileCheck2,
  FileSpreadsheet
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-gold-400 p-[1px] shadow-glow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Award className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                RUDVAY<span className="text-brand-400 font-bold ml-1">TECH</span>
              </span>
              <div className="text-[10px] tracking-widest text-gold-400/80 font-mono uppercase">Cert Platform</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/verify" 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/verify") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              Verify Certificate
            </Link>

            {/* Coordinator Links */}
            {role === "COORDINATOR" && (
              <>
                <Link 
                  href="/coordinator" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/coordinator" ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/coordinator/templates" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/coordinator/templates") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  Templates
                </Link>
                <Link 
                  href="/coordinator/generate/single" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/coordinator/generate/single") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-slate-400" />
                  Single
                </Link>
                <Link 
                  href="/coordinator/generate/bulk" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/coordinator/generate/bulk") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  Bulk Excel
                </Link>
                <Link 
                  href="/coordinator/emails" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/coordinator/emails") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  Sent Mails
                </Link>
              </>
            )}

            {/* Admin Links */}
            {role === "ADMIN" && (
              <>
                <Link 
                  href="/admin" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/admin" ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  Admin Panel
                </Link>
                <Link 
                  href="/admin/coordinators" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/admin/coordinators") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  Coordinators
                </Link>
                <Link 
                  href="/coordinator/emails" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/coordinator/emails") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  Sent Mails
                </Link>
                <Link 
                  href="/admin/smtp" 
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive("/admin/smtp") ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  SMTP Settings
                </Link>
              </>
            )}
          </nav>

          {/* Right Action / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-full pl-3 pr-1.5 py-1">
                <div className="text-xs">
                  <span className="text-slate-400 mr-1.5">Role:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                    role === "ADMIN" ? "bg-gold-500/10 text-gold-400 border border-gold-500/20" : "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  }`}>
                    {role || "USER"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-glow hover:shadow-brand-500/30"
              >
                <LogIn className="w-4 h-4" />
                Staff Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-400" /> Verify Certificate</span>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </Link>

          {role === "COORDINATOR" && (
            <>
              <Link
                href="/coordinator"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>Coordinator Dashboard</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                href="/coordinator/templates"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>Templates</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                href="/coordinator/generate/bulk"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>Bulk Certificate Generator</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>Admin Dashboard</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                href="/admin/coordinators"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>Coordinators</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                href="/admin/smtp"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <span>SMTP Configuration</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            {user ? (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                <LogIn className="w-4 h-4" /> Staff Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
