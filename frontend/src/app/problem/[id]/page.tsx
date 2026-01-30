"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { problemAPI, progressAPI, submissionAPI } from "@/lib/api";
import DiscussionSection from "./DiscussionSection";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface TestCase {
    input: string;
    expected: string;
}

interface Problem {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    topic: string;
    description: string;
    starterCode: string;
    testCases: TestCase[];
    hintBrute: string;
    hintOptimized: string;
    bestSolution: string;
}

interface Progress {
    status: string;
    attempts: number;
    successfulSubmissions: number;
    notes: string;
}

export default function ProblemPage() {
    const router = useRouter();
    const params = useParams();
    const problemId = params.id as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [code, setCode] = useState("");
    const [notes, setNotes] = useState("");
    const [activeTab, setActiveTab] = useState<"description" | "hints" | "solution" | "discussion">("description");
    const [mobileView, setMobileView] = useState<"problem" | "editor">("problem");
    const [hintLevel, setHintLevel] = useState(0);
    const [verdict, setVerdict] = useState<{ verdict: string; feedback: string; passed: boolean } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProblem = useCallback(async () => {
        if (!problemId) return;
        try {
            const [problemRes, progressRes] = await Promise.all([
                problemAPI.getById(problemId),
                progressAPI.getByProblem(problemId),
            ]);

            setProblem(problemRes.data);
            setProgress(progressRes.data);
            setNotes(progressRes.data.notes || "");

            const savedCode = localStorage.getItem(`code_${problemId}`);
            setCode(savedCode || problemRes.data.starterCode);
        } catch (error) {
            console.error("Failed to fetch problem:", error);
        } finally {
            setLoading(false);
        }
    }, [problemId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/auth/login");
            return;
        }
        fetchProblem();
    }, [router, fetchProblem]);

    useEffect(() => {
        if (problemId && code) {
            localStorage.setItem(`code_${problemId}`, code);
        }
    }, [code, problemId]);

    const handleSubmit = async () => {
        if (!problem) return;
        setSubmitting(true);
        setVerdict(null);

        try {
            const response = await submissionAPI.submit({
                problemId: problem.id,
                code,
                language: "cpp",
            });
            setVerdict(response.data);

            if (response.data.passed) {
                const progressRes = await progressAPI.getByProblem(problemId);
                setProgress(progressRes.data);
            }
        } catch (err: unknown) {
            const error = err as { response?: { status: number; data?: { code?: string; error?: string } } };
            console.error("Submission failed:", error);

            if (error.response?.status === 403 && error.response?.data?.code === "TRIAL_LIMIT_REACHED") {
                setVerdict({
                    verdict: "Trial Limit Reached",
                    feedback: "You have used your 3 free trial submissions. Please add your OpenRouter API Key in the dashboard/settings to continue.",
                    passed: false,
                });
                // Optionally redirect or show a specific modal here
                // For now, the feedback message is clear.
            } else {
                setVerdict({
                    verdict: "Error",
                    feedback: error.response?.data?.error || "Failed to submit. Please check if backend is running.",
                    passed: false,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!problemId) return;
        setSaving(true);
        try {
            await progressAPI.updateNotes(problemId, notes);
        } catch (error) {
            console.error("Failed to save notes:", error);
        } finally {
            setSaving(false);
        }
    };

    const getDifficultyClass = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case "easy": return "badge-easy";
            case "medium": return "badge-medium";
            case "hard": return "badge-hard";
            default: return "badge-topic";
        }
    };

    const getVerdictClass = (v: string) => {
        if (v.toLowerCase().includes("accepted")) return "verdict-accepted";
        if (v.toLowerCase().includes("wrong")) return "verdict-wrong";
        return "verdict-error";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-[var(--text-secondary)]">Loading...</div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-[var(--text-muted)] mb-4">Problem not found</p>
                    <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[var(--bg-primary)] flex flex-col overflow-hidden">
            {/* Header - Full Width */}
            <header className="w-full flex items-center justify-between px-4 lg:px-6 py-3 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                    <Link href="/dashboard" className="text-3xl font-bold gradient-text shrink-0">
                        Woohoo DSA
                    </Link>
                    <div className="w-px h-6 bg-[var(--glass-border)]"></div>
                    <h1 className="font-semibold truncate">{problem.title}</h1>
                    <span className={getDifficultyClass(problem.difficulty)}>{problem.difficulty}</span>
                    <span className="text-[var(--text-muted)] text-sm hidden sm:inline">{problem.topic}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    {progress?.status === "solved" && (
                        <span className="text-[var(--accent-green)] text-sm font-medium">Solved</span>
                    )}
                    <span className="text-[var(--text-muted)] text-sm">
                        {progress?.successfulSubmissions || 0} solutions
                    </span>
                </div>
            </header>

            {/* Mobile Toggle */}
            <div className="lg:hidden flex border-b border-[var(--glass-border)] bg-[var(--bg-tertiary)]">
                <button
                    onClick={() => setMobileView("problem")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mobileView === "problem"
                        ? "text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]"
                        : "text-[var(--text-muted)]"
                        }`}
                >
                    Problem
                </button>
                <button
                    onClick={() => setMobileView("editor")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mobileView === "editor"
                        ? "text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]"
                        : "text-[var(--text-muted)]"
                        }`}
                >
                    Code
                </button>
            </div>

            {/* Main Content - Full Width Split */}
            <div className="flex-1 w-full flex overflow-hidden">
                {/* Left Panel - Problem Description */}
                <div className={`${mobileView === "problem" ? "flex" : "hidden"} lg:flex w-full lg:w-1/2 flex-col border-r border-[var(--glass-border)]`}>
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-[var(--glass-border)] bg-[var(--bg-tertiary)] shrink-0 px-2">
                        {(["description", "hints", "solution", "discussion"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-3 text-base font-medium capitalize transition-colors ${activeTab === tab
                                    ? "text-[var(--accent-cyan)] border-b-2 border-[var(--accent-cyan)]"
                                    : "text-[var(--text-muted)] hover:text-white"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === "description" && (
                            <div>
                                <pre className="whitespace-pre-wrap text-base text-[var(--text-secondary)] font-sans leading-relaxed mb-8">
                                    {problem.description}
                                </pre>

                                <h3 className="font-semibold mb-4">Test Cases</h3>
                                <div className="space-y-3">
                                    {problem.testCases.map((tc, i) => (
                                        <div key={i} className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-md p-4">
                                            <p className="text-xs text-[var(--text-muted)] mb-2">Example {i + 1}</p>
                                            <p className="font-mono text-sm mb-1">
                                                <span className="text-[var(--text-muted)]">Input:</span> {tc.input}
                                            </p>
                                            <p className="font-mono text-sm">
                                                <span className="text-[var(--text-muted)]">Output:</span>{" "}
                                                <span className="text-[var(--accent-green)]">{tc.expected}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "hints" && (
                            <div className="space-y-4">
                                <p className="text-[var(--text-secondary)] text-sm mb-6">
                                    Reveal hints progressively if you&apos;re stuck.
                                </p>

                                <div className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setHintLevel((h) => (h >= 1 ? h : 1))}
                                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        <span className="font-medium">Hint 1: Brute Force Approach</span>
                                        <span className="text-[var(--text-muted)]">{hintLevel >= 1 ? "−" : "+"}</span>
                                    </button>
                                    {hintLevel >= 1 && (
                                        <div className="p-4 border-t border-[var(--glass-border)] text-sm text-[var(--text-secondary)]">
                                            {problem.hintBrute}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-md overflow-hidden">
                                    <button
                                        onClick={() => hintLevel >= 1 && setHintLevel((h) => (h >= 2 ? h : 2))}
                                        className={`w-full flex items-center justify-between p-4 transition-colors ${hintLevel < 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-secondary)]"}`}
                                    >
                                        <span className="font-medium">Hint 2: Optimized Approach</span>
                                        <span className="text-[var(--text-muted)]">{hintLevel >= 2 ? "−" : "+"}</span>
                                    </button>
                                    {hintLevel >= 2 && (
                                        <div className="p-4 border-t border-[var(--glass-border)] text-sm text-[var(--text-secondary)]">
                                            {problem.hintOptimized}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "solution" && (
                            <div>
                                <div className="bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/30 rounded-md p-4 mb-6">
                                    <p className="text-[var(--accent-orange)] text-sm">
                                        Only view this after you&apos;ve tried solving it yourself!
                                    </p>
                                </div>
                                <div className="border border-[var(--glass-border)] rounded-md overflow-hidden">
                                    <Editor
                                        height="400px"
                                        defaultLanguage="cpp"
                                        value={problem.bestSolution}
                                        theme="vs-dark"
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            fontSize: 14,
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "discussion" && (
                            <DiscussionSection problemId={problem.id} />
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="border-t border-[var(--glass-border)] bg-gradient-to-b from-[var(--bg-tertiary)] to-[var(--bg-secondary)] shrink-0">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📝</span>
                                    <h3 className="font-semibold text-base text-white">Your Notes</h3>
                                </div>
                                <button
                                    onClick={handleSaveNotes}
                                    disabled={saving}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${saving
                                        ? "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                                        : "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 border border-[var(--accent-cyan)]/30"
                                        }`}
                                >
                                    {saving ? "💾 Saving..." : "💾 Save Notes"}
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="✍️ Add your approach, key insights, time complexity notes, or things to remember..."
                                className="w-full h-24 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)]/50 focus:outline-none resize-none transition-all"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                                <span>💡</span> Notes are saved to your account and persist across sessions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Code Editor */}
                <div className={`${mobileView === "editor" ? "flex" : "hidden"} lg:flex w-full lg:w-1/2 flex-col`}>
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--glass-border)] shrink-0">
                        <span className="text-sm font-mono text-[var(--text-secondary)]">C++</span>
                        <button
                            onClick={() => setCode(problem.starterCode)}
                            className="text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            Reset Code
                        </button>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage="cpp"
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', monospace",
                                lineNumbers: "on",
                                automaticLayout: true,
                                tabSize: 4,
                                insertSpaces: true,
                                padding: { top: 16 },
                            }}
                        />
                    </div>

                    {/* Verdict Display */}
                    {verdict && (
                        <div className={`px-4 py-4 border-t border-[var(--glass-border)] ${getVerdictClass(verdict.verdict)} shrink-0`}>
                            <div className="font-semibold">{verdict.verdict}</div>
                            <p className="text-sm mt-1 opacity-90">{verdict.feedback}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="px-4 py-4 bg-[var(--bg-secondary)] border-t border-[var(--glass-border)] shrink-0">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn-success w-full py-3 disabled:opacity-50"
                        >
                            {submitting ? "Evaluating with AI..." : "Submit Solution"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
