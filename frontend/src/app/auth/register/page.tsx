"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        apiKey: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({
                username: formData.username,
                password: formData.password,
                apiKey: formData.apiKey,
            });
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            router.push("/dashboard");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold gradient-text">
                        Woohoo DSA
                    </Link>
                    <p className="text-[var(--text-secondary)] mt-2 text-sm">
                        Create your account
                    </p>
                </div>

                <div className="glass-card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-field"
                                placeholder="johndoe"
                                required
                                minLength={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                OpenRouter API Key <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                            </label>
                            <p className="text-xs text-[var(--accent-green)] mb-2">
                                💡 Skip this to get <strong>3 free trial submissions</strong>!
                            </p>
                            <input
                                type="password"
                                value={formData.apiKey}
                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                className="input-field"
                                placeholder="sk-or-v1-..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-[var(--text-secondary)] text-sm">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-[var(--accent-cyan)] hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
