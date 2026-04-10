import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session.
  // withCredentials sends the httpOnly cookie if the browser allows it (same-domain
  // or cross-domain with sameSite:none + Secure). If that fails with 401 the
  // request interceptor will have already attached the localStorage token as an
  // Authorization header, so the same /auth/me call covers the header path too.
  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {}) // no valid session — stay logged out
      .finally(() => setLoading(false));
  }, []);

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    // Persist token for the Authorization-header fallback path
    if (data.token) localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  async function logout() {
    localStorage.removeItem("token");
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
