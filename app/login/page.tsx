"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false, // Handle redirect manually to avoid full page reload if possible
      });

      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        router.push("/dashboard");
        router.refresh(); // Ensure the router state and server components refresh with new session
      }
    } catch (err) {
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Staff Login</h1>
      
      {error && (
        <div style={{ color: "red", marginBottom: "1rem", padding: "0.5rem", border: "1px solid red", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="identifier" style={{ display: "block", marginBottom: "0.5rem" }}>Email or Phone</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="admin@crestcare.com or +91..."
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: "0.75rem", 
            backgroundColor: loading ? "#9ca3af" : "#2563eb", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
