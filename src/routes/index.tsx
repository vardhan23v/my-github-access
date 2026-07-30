import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useServerFn } from "@tanstack/react-start";

import {
  fetchProfile,
  fetchReadme,
  fetchRepos,
  updateReadme,
  generatePortfolioMarkdown,
} from "@/lib/github.functions";
import type { GitHubProfile, ReadmeInfo, Repo } from "@/lib/github";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitHub Portfolio README Builder" },
      {
        name: "description",
        content:
          "Generate and publish a portfolio-style README for your GitHub profile or repository.",
      },
      { property: "og:title", content: "GitHub Portfolio README Builder" },
      {
        property: "og:description",
        content:
          "Generate and publish a portfolio-style README for your GitHub profile or repository.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function parseRepoInput(input: string): [string, string] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/i
  );
  if (urlMatch) {
    return [urlMatch[1], urlMatch[2]];
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }

  return null;
}

function Index() {
  const getProfile = useServerFn(fetchProfile);
  const getRepos = useServerFn(fetchRepos);
  const getReadmeInfo = useServerFn(fetchReadme);
  const publishReadme = useServerFn(updateReadme);

  const [username, setUsername] = useState("vardhan23v");
  const [targetInput, setTargetInput] = useState("vardhan23v/my-github-access");
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoNames, setSelectedRepoNames] = useState<Set<string>>(
    new Set()
  );
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [includeStats, setIncludeStats] = useState(true);

  const [markdown, setMarkdown] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [readmeInfo, setReadmeInfo] = useState<ReadmeInfo>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const sortedRepos = useMemo(
    () =>
      [...repos].filter((r) => !r.private && !r.forks_count).sort((a, b) => b.stargazers_count - a.stargazers_count),
    [repos]
  );

  // Auto-generate markdown whenever inputs change.
  useEffect(() => {
    if (!profile) {
      setMarkdown("");
      return;
    }
    const featured = sortedRepos.filter((r) => selectedRepoNames.has(r.name));
    const md = generatePortfolioMarkdown({
      profile,
      repos,
      tagline,
      about,
      email,
      website,
      twitter,
      linkedIn,
      featuredRepos: featured,
      includeStats,
    });
    setMarkdown(md);
  }, [
    profile,
    repos,
    sortedRepos,
    selectedRepoNames,
    tagline,
    about,
    email,
    website,
    twitter,
    linkedIn,
    includeStats,
  ]);

  const loadData = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const [profileData, reposData] = await Promise.all([
        getProfile({ data: { username } }),
        getRepos({ data: { username } }),
      ]);
      setProfile(profileData);
      setRepos(reposData);

      const nonForks = reposData.filter((r) => !r.private && !r.forks_count);
      const top = nonForks
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6)
        .map((r) => r.name);
      setSelectedRepoNames(new Set(top));

      setTagline(
        profileData.bio?.replace(/\r?\n/g, " ") ||
          "Full-stack developer building things for the web."
      );
      setAbout(
        profileData.bio
          ? `${profileData.bio}\n\nI love clean code, open source, and shipping products people enjoy.`
          : "I enjoy turning ideas into working products and sharing what I learn along the way."
      );
      setEmail(profileData.email || "");
      setWebsite(profileData.blog || "");
      setTwitter(profileData.twitter_username || "");

      await loadReadme();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to load GitHub data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReadme = async () => {
    const parsed = parseRepoInput(targetInput);
    if (!parsed) {
      setReadmeInfo(null);
      return;
    }
    const [owner, repo] = parsed;
    setStatus(null);
    try {
      const info = await getReadmeInfo({ data: { owner, repo } });
      setReadmeInfo(info);
    } catch (error) {
      setReadmeInfo(null);
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to load README.",
      });
    }
  };

  const handlePublish = async () => {
    const parsed = parseRepoInput(targetInput);
    if (!parsed) {
      setStatus({ type: "error", message: "Target repo format is invalid." });
      return;
    }
    const [owner, repo] = parsed;
    setPublishing(true);
    setStatus(null);
    try {
      const result = await publishReadme({
        data: {
          owner,
          repo,
          message: "Update portfolio README",
          content: markdown,
          sha: readmeInfo?.sha,
        },
      });
      setStatus({
        type: "success",
        message: result.url
          ? `README published. View it: ${result.url}`
          : "README published successfully.",
      });
      await loadReadme();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to publish README.",
      });
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRepo = (name: string) => {
    setSelectedRepoNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            GitHub Portfolio README Builder
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Pull your public GitHub data, customize your README, and publish it
            to any repository in one click.
          </p>
        </header>

        <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">GitHub username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Target repo</label>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onBlur={loadReadme}
                placeholder="owner/repo or GitHub URL"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                disabled={loading}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Fetch GitHub data"}
              </button>
            </div>
          </div>
          {readmeInfo ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Existing README found — publishing will update it.
            </p>
          ) : targetInput ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No README found — publishing will create one.
            </p>
          ) : null}
        </div>

        {status && (
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              status.type === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {status.message}
          </div>
        )}

        {profile && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Editor */}
            <section className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Profile info</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">About me</label>
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Website</label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Twitter / X</label>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">LinkedIn</label>
                      <input
                        type="text"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Featured projects</h2>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {sortedRepos.map((repo) => (
                    <label
                      key={repo.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-accent/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRepoNames.has(repo.name)}
                        onChange={() => toggleRepo(repo.name)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          {repo.name}
                          {repo.stargazers_count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ⭐ {repo.stargazers_count}
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-muted-foreground">
                          {repo.description || "No description"}
                        </p>
                        {repo.language && (
                          <span className="mt-1 inline-block text-xs text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Options</h2>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={includeStats}
                    onChange={(e) => setIncludeStats(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Include GitHub stats image
                </label>
              </div>
            </section>

            {/* Preview / raw */}
            <section className="flex h-full flex-col rounded-xl border border-border bg-card shadow-sm">
              <div className="flex gap-2 border-b border-border p-3">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-foreground hover:bg-accent"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "edit"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-foreground hover:bg-accent"
                  }`}
                >
                  Edit Markdown
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-4">
                {activeTab === "preview" ? (
                  <article className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto rounded-md border border-border bg-background p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {markdown}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>

              <div className="border-t border-border p-4">
                <button
                  onClick={handlePublish}
                  disabled={publishing || !markdown}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {publishing ? "Publishing..." : "Publish README to GitHub"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
