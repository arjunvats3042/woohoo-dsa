"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authAPI } from "@/lib/api";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    if (token) {
      authAPI.getProfile()
        .then(res => {
          if (res.data.apiKey) setSavedKey(res.data.apiKey);
        })
        .catch(err => console.error("Failed to load profile", err));
    }
  }, []);

  const handleSaveKey = async () => {
    if (!isLoggedIn) {
      alert("Please login to save your API key for future use.");
      return;
    }

    if (apiKey.trim()) {
      try {
        await authAPI.updateApiKey(apiKey.trim());
        setSavedKey(apiKey.trim());
        setApiKey("");
        alert("API Key saved successfully!");
      } catch (err) {
        console.error("Failed to save API key", err);
        alert("Failed to save API key. Please try again.");
      }
    }
  };

  const handleRemoveKey = async () => {
    try {
      if (isLoggedIn) {
        await authAPI.updateApiKey("");
      }
      localStorage.removeItem("openrouter_api_key"); // Clear legacy
      setSavedKey("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-3xl w-full">
        {/* Logo */}
        <h1 className="text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Woohoo DSA
          </span>
        </h1>

        <p className="text-[var(--text-muted)] text-lg mb-12">
          Practice DSA problems with AI-powered solution evaluation
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-16 py-5 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/30 w-full sm:w-auto"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="border-2 border-white/30 text-white px-12 py-5 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition w-full sm:w-auto"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-5 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-2xl shadow-cyan-500/30 w-full sm:w-auto"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* API Key Section */}
        <div className="bg-gradient-to-b from-[#12121a] to-[#0d0d14] border border-[var(--glass-border)] rounded-2xl p-8 text-left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔑</span>
              <h2 className="text-xl font-bold text-white">Setup Your API Key</h2>
            </div>
            {savedKey && (
              <span className="text-sm text-[var(--accent-green)] flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></span>
                Key Saved
              </span>
            )}
          </div>

          <p className="text-[var(--text-secondary)] mb-6">
            To evaluate your code solutions, we use AI. You need a free OpenRouter API key.
          </p>

          {/* Saved Key Display */}
          {savedKey ? (
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Your API Key</p>
                <p className="font-mono text-sm text-white">
                  {savedKey.substring(0, 15)}...{savedKey.substring(savedKey.length - 5)}
                </p>
              </div>
              <button
                onClick={handleRemoveKey}
                className="text-sm text-red-400 hover:text-red-300 transition"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none"
                />
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim()}
                  className="px-6 py-3 bg-[var(--accent-cyan)] text-black font-semibold rounded-lg hover:bg-[var(--accent-cyan)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {/* Toggle Instructions */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-[var(--accent-cyan)] text-sm font-medium flex items-center gap-2 hover:underline mb-4"
          >
            {showInstructions ? "▼" : "▶"} How to get a FREE API Key
          </button>

          {/* Instructions */}
          {showInstructions && (
            <div className="bg-[var(--bg-primary)] rounded-lg p-6 border border-[var(--glass-border)]">
              <ol className="space-y-4 text-[var(--text-secondary)]">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-cyan)] hover:underline font-medium">openrouter.ai</a></p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p>Click <strong className="text-white">&quot;Sign In&quot;</strong> (top right) and create an account using Google or GitHub</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p>After logging in, go to <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-cyan)] hover:underline font-medium">openrouter.ai/settings/keys</a></p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <p>Click <strong className="text-white">&quot;Create Key&quot;</strong> button</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <div>
                    <p>Give it a name (e.g., &quot;Woohoo DSA&quot;) and click <strong className="text-white">&quot;Create&quot;</strong></p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-full flex items-center justify-center text-sm font-bold">6</span>
                  <div>
                    <p>Copy the key (starts with <code className="bg-[var(--bg-tertiary)] px-2 py-0.5 rounded text-sm">sk-or-v1-</code>) and paste it above</p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 p-4 bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 rounded-lg">
                <p className="text-[var(--accent-green)] text-sm">
                  💡 <strong>It&apos;s FREE!</strong> OpenRouter gives free credits. We use a free model so you won&apos;t be charged.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
