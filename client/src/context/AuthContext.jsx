import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — attempt to restore session from httpOnly cookie
  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {}) // no valid cookie — stay logged out
      .finally(() => setLoading(false));
  }, []);

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    // Cookie is set by the server; just store the user object
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
  }

  async function logout() {
    // Ask the server to clear the httpOnly cookie
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
