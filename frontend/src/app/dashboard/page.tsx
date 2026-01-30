"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { problemAPI, progressAPI, authAPI } from "@/lib/api";

interface Problem {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    topic: string;
}

interface Progress {
    problemId: string;
    status: string;
}

interface User {
    username: string;
    solvedCount: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, string>>({});
    const [user, setUser] = useState<User | null>(null);
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            const [problemsRes, progressRes, profileRes, topicsRes] = await Promise.all([
                problemAPI.getAll(),
                progressAPI.getAll(),
                authAPI.getProfile(),
                problemAPI.getTopics(),
            ]);

            setProblems(problemsRes.data);
            setUser(profileRes.data);
            const topicsList = topicsRes.data || [];
            setTopics(topicsList);
            // Set first topic as default if not already set
            if (topicsList.length > 0 && !selectedTopic) {
                setSelectedTopic(topicsList[0]);
            }

            const pMap: Record<string, string> = {};
            progressRes.data.forEach((p: Progress) => {
                pMap[p.problemId] = p.status;
            });
            setProgressMap(pMap);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    const filteredProblems = selectedTopic
        ? problems.filter((p) => p.topic === selectedTopic)
        : [];

    const getDifficultyClass = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case "easy": return "badge-easy";
            case "medium": return "badge-medium";
            case "hard": return "badge-hard";
            default: return "badge-topic";
        }
    };

    const getStatusIndicator = (problemId: string) => {
        const status = progressMap[problemId];
        if (status === "solved") return <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)]"></span>;
        if (status === "attempted") return <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-yellow)]"></span>;
        return <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]/30"></span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-[var(--text-secondary)]">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Navbar - Full Width */}
            <nav className="sticky top-0 z-50 w-full bg-[var(--bg-secondary)] border-b border-[var(--glass-border)]">
                <div className="w-full px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/" className="text-3xl font-bold gradient-text">
                        Woohoo DSA
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-[var(--text-secondary)] text-sm">
                            {user?.username}
                        </span>
                        <button onClick={handleLogout} className="btn-secondary py-2 px-4 text-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content - Full Width */}
            <div className="w-full px-6 lg:px-10 py-8">
                {/* Stats Row */}
                <div className="flex gap-6 mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-[var(--text-muted)] text-sm">Problems Solved</span>
                        <span className="text-2xl font-bold text-[var(--accent-green)]">{user?.solvedCount || 0}</span>
                    </div>
                </div>

                {/* Topic Filter */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-4">
                        {topics.map((topic) => (
                            <button
                                key={topic}
                                onClick={() => setSelectedTopic(topic)}
                                className={`px-5 py-2.5 rounded-lg text-base transition-all ${selectedTopic === topic
                                    ? "bg-[var(--accent-cyan)] text-black font-semibold"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                                    }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Problems Table - Full Width */}
                <div className="w-full bg-[var(--bg-secondary)] rounded-lg border border-[var(--glass-border)] overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--glass-border)] text-sm text-[var(--text-muted)]">
                        <div className="col-span-1">S.No.</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-5">Title</div>
                        <div className="col-span-2">Topic</div>
                        <div className="col-span-3">Difficulty</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-[var(--glass-border)]">
                        {filteredProblems.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)]">
                                No problems found.
                            </div>
                        ) : (
                            filteredProblems.map((problem, index) => (
                                <Link
                                    href={`/problem/${problem.id}`}
                                    key={problem.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--bg-tertiary)] transition-colors items-center"
                                >
                                    <div className="col-span-1 text-center text-[var(--text-muted)]">
                                        {index + 1}
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {getStatusIndicator(problem.id)}
                                    </div>
                                    <div className="col-span-5">
                                        <span className="font-medium hover:text-[var(--accent-cyan)] transition-colors">
                                            {problem.title}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[var(--text-secondary)] text-sm">{problem.topic}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <span className={getDifficultyClass(problem.difficulty)}>
                                            {problem.difficulty}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
