export type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
};

export type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  forks_count: number;
  topics: string[];
  pushed_at: string;
  private: boolean;
};

export type ReadmeInfo = {
  content: string;
  sha: string;
} | null;

export function generatePortfolioMarkdown({
  profile,
  repos,
  tagline,
  about,
  email,
  website,
  twitter,
  linkedIn,
  featuredRepos,
  includeStats,
}: {
  profile: GitHubProfile;
  repos: Repo[];
  tagline: string;
  about: string;
  email: string;
  website: string;
  twitter: string;
  linkedIn: string;
  featuredRepos: Repo[];
  includeStats: boolean;
}) {
  const displayName = profile.name || profile.login;
  const topLanguages = Array.from(
    new Set(repos.map((r) => r.language).filter(Boolean))
  ) as string[];

  const languageBadges = topLanguages
    .slice(0, 8)
    .map(
      (lang) =>
        `<img src="https://img.shields.io/badge/${encodeURIComponent(
          lang ?? ""
        )}-333?style=flat&logo=${encodeURIComponent(
          lang?.toLowerCase() ?? ""
        )}" alt="${lang}" />`
    )
    .join(" ");

  const featuredTable = featuredRepos.length
    ? featuredRepos
        .map(
          (r) =>
            `| [${r.name}](${r.html_url}) | ${r.description || "—"} | ${
              r.language || "—"
            } | ⭐ ${r.stargazers_count} |`
        )
        .join("\n")
    : "_No featured projects selected yet._";

  const socialLinks = [
    twitter ? `[X / Twitter](https://x.com/${twitter})` : "",
    linkedIn ? `[LinkedIn](https://linkedin.com/in/${linkedIn})` : "",
    website ? `[Website](https://${website.replace(/^https?:\/\//, "")})` : "",
    email ? `[Email](mailto:${email})` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const visitorBadge = `![profile views](https://komarev.com/ghpvc/?username=${profile.login}&color=0e76a8)`;

  const statsSection = includeStats
    ? `\n## GitHub Stats\n\n<p align="center">\n  <img src="https://github-readme-stats.vercel.app/api?username=${profile.login}&show_icons=true&theme=transparent&hide_border=false" alt="GitHub stats" />\n</p>\n`
    : "";

  return `<h1 align="center">Hi 👋, I'm ${displayName}</h1>
<p align="center">${tagline}</p>

<p align="center">
  <img src="${profile.avatar_url}" width="120" style="border-radius: 50%" alt="${displayName}" />
</p>

<p align="center">${visitorBadge}</p>

## About Me

${about}

## Tech & Tools

<p align="center">${languageBadges}</p>

## Featured Projects

| Project | Description | Language | Stars |
| --- | --- | --- | --- |
${featuredTable}
${statsSection}
## Connect With Me

${socialLinks || profile.html_url}
`;
}
