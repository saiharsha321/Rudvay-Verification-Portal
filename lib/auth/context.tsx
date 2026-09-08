"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  getIdTokenResult 
} from "firebase/auth";
import { auth } from "../firebase/client";

export type UserRole = "ADMIN" | "COORDINATOR" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleFromToken = async (u: User): Promise<UserRole> => {
    try {
      const tokenResult = await getIdTokenResult(u, true);
      const claims = tokenResult.claims;
      if (claims.role === "ADMIN" || claims.admin === true) {
        return "ADMIN";
      }
      if (claims.role === "COORDINATOR" || claims.coordinator === true) {
        return "COORDINATOR";
      }
      // Demo admin fallback for initial setup
      if (u.email?.includes("admin")) return "ADMIN";
      return "COORDINATOR";
    } catch (e) {
      return "COORDINATOR";
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const detectedRole = await fetchRoleFromToken(currentUser);
        setRole(detectedRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserRole> => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const detectedRole = await fetchRoleFromToken(cred.user);
    setUser(cred.user);
    setRole(detectedRole);
    return detectedRole;
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setRole(null);
  };

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
