import type { GitHubProfile, ReadmeInfo, Repo } from "./github";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

async function githubFetch<T>(
  path: string,
  options: {
    method?: string;
    query?: Record<string, string>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const githubKey = process.env.GITHUB_API_KEY;

  if (!lovableKey || !githubKey) {
    throw new Error("GitHub connector is not configured.");
  }

  const url = new URL(GATEWAY_URL + path);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": githubKey,
    ...options.headers,
  };

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), init);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API error [${response.status}]: ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as T;
}

export async function getUserProfile(username: string): Promise<GitHubProfile> {
  const raw = await githubFetch<Record<string, unknown>>(`/users/${username}`);
  return {
    login: raw.login as string,
    name: (raw.name as string | null) ?? null,
    avatar_url: raw.avatar_url as string,
    bio: (raw.bio as string | null) ?? null,
    blog: (raw.blog as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    twitter_username: (raw.twitter_username as string | null) ?? null,
    public_repos: raw.public_repos as number,
    followers: raw.followers as number,
    following: raw.following as number,
    html_url: raw.html_url as string,
  };
}

export async function getUserRepos(username: string): Promise<Repo[]> {
  const raw = await githubFetch<Array<Record<string, unknown>>>(
    `/users/${username}/repos`,
    { query: { sort: "updated", per_page: "100" } }
  );
  return raw.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    html_url: r.html_url as string,
    stargazers_count: (r.stargazers_count as number) ?? 0,
    language: (r.language as string | null) ?? null,
    forks_count: (r.forks_count as number) ?? 0,
    topics: (r.topics as string[]) ?? [],
    pushed_at: (r.pushed_at as string) ?? "",
    private: (r.private as boolean) ?? false,
  }));
}

export async function getReadme(owner: string, repo: string): Promise<ReadmeInfo> {
  try {
    const raw = await githubFetch<{
      content: string;
      sha: string;
      encoding: string;
    }>(`/repos/${owner}/${repo}/readme`);
    const normalized = raw.content.replace(/\s/g, "");
    const decoded = Buffer.from(normalized, "base64").toString("utf-8");
    return { content: decoded, sha: raw.sha };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function putReadme(
  owner: string,
  repo: string,
  message: string,
  content: string,
  sha?: string
) {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
  };
  if (sha) {
    body.sha = sha;
  }

  return githubFetch<Record<string, unknown>>(
    `/repos/${owner}/${repo}/contents/README.md`,
    { method: "PUT", body }
  );
}
