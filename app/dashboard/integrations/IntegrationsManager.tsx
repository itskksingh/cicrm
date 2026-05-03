"use client";

import { useState, useEffect, FormEvent } from "react";

interface CredentialsStatus {
  phoneNumberId: string;
  hasAccessToken: boolean;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCount: number;
}

export default function IntegrationsManager() {
  const [status, setStatus] = useState<CredentialsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form State
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Data Fetching
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/integrations/whatsapp");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setPhoneNumberId(data.phoneNumberId || "");
        } else if (res.status !== 404) {
          const errData = await res.json();
          setError(errData.error || "Failed to fetch credentials");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  // Define a wrapper for re-fetching if needed elsewhere
  const refreshCredentials = () => {
    // This can be used by handleSave/handleDelete
    const fetchWrapper = async () => {
      try {
        const res = await fetch("/api/integrations/whatsapp");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setPhoneNumberId(data.phoneNumberId || "");
        }
      } catch {
        // Silently fail on refresh or handle as needed
      }
    };
    fetchWrapper();
  };

  // 2. Submit Flow (Save / Update)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (saving) return;

    // Strict frontend validation
    const trimmedPhoneId = phoneNumberId.trim();
    const trimmedToken = accessToken.trim();
    
    if (!trimmedPhoneId) {
      setError("Phone Number ID is required.");
      return;
    }
    
    if (!trimmedToken) {
      setError("Access Token is required to save credentials.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        phoneNumberId: trimmedPhoneId,
        accessToken: trimmedToken,
      };

      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save credentials");
      }

      setSuccess("Credentials saved successfully.");
      setAccessToken(""); // clear it out after save
      refreshCredentials(); // refresh status card
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Remove Flow
  const handleDelete = async () => {
    if (deleting) return; // Prevent duplicate submissions

    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete credentials");
      }

      setSuccess("Credentials removed. System will fall back to environment defaults if configured.");
      setStatus(null);
      setPhoneNumberId("");
      setAccessToken("");
      setConfirmDelete(false);

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 animate-pulse">Loading credentials...</div>;
  }

  const isConfigured = !!status;

  let healthColor = "bg-slate-300";
  let healthText = "Not Configured";

  if (isConfigured) {
    if (status.failureCount > 3 || !status.lastSuccessAt) {
      healthColor = "bg-red-500";
      healthText = "Issue";
    } else if (status.failureCount > 0) {
      healthColor = "bg-yellow-500";
      healthText = "Degraded";
    } else {
      healthColor = "bg-green-500";
      healthText = "Active";
    }
  }

  return (
    <div className="space-y-6">
      {/* A) Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Connection Status</h2>
        {isConfigured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Connected Number ID</p>
              <p className="font-medium text-slate-900">{status.phoneNumberId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${healthColor}`}></span>
                <span className="font-medium text-slate-900">{healthText}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last Success</p>
              <p className="font-medium text-slate-900">
                {status.lastSuccessAt ? new Date(status.lastSuccessAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Failure Count</p>
              <p className="font-medium text-red-600">
                {status.failureCount}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-medium">Not configured. Enter credentials below to enable WhatsApp.</span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">
          {success}
        </div>
      )}

      {/* B) Credentials Form & C) Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {isConfigured ? 'Update Credentials' : 'Add Credentials'}
        </h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="e.g. 102345678901234"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={status?.hasAccessToken ? "•••••••• (Enter token to update)" : "EAAG..."}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Tokens are securely encrypted before saving. We never display the raw token.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving || deleting}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      {isConfigured && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
          </div>

          <div className="p-6">
            {!confirmDelete ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">Remove WhatsApp Credentials</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Removes your stored credentials. WhatsApp messaging will stop unless env fallback is configured.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                  className="shrink-0 px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                >
                  Remove Credentials
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-700">WhatsApp will stop working immediately</p>
                    <p className="text-sm text-red-600 mt-1">
                      All outbound messages from this organization will fail. The system will attempt to fall back to the shared environment token if one is configured — but this is not guaranteed for multi-tenant setups.
                    </p>
                  </div>
                </div>

                {/* Confirm Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Removing...
                      </>
                    ) : 'Yes, Remove Credentials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
