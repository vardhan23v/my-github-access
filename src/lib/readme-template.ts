import type { GitHubProfile, Repo } from "./github";

export type TemplateContext = {
  profile: GitHubProfile;
  repos: Repo[];
  featuredRepos: Repo[];
  tagline: string;
  about: string;
  email: string;
  website: string;
  twitter: string;
  linkedIn: string;
  includeStats: boolean;
  badges?: Partial<BadgeOptions>;
};

/** Optional badge / stats images the user can toggle on or off. */
export type BadgeOptions = {
  visitorBadge: boolean;
  languageBadges: boolean;
  followersBadge: boolean;
  starsBadge: boolean;
  statsCard: boolean;
  topLangsCard: boolean;
  streakCard: boolean;
  trophies: boolean;
};

export const BADGE_OPTIONS: {
  key: keyof BadgeOptions;
  label: string;
  hint: string;
}[] = [
  { key: "visitorBadge", label: "Profile views", hint: "Visitor counter badge" },
  { key: "languageBadges", label: "Language badges", hint: "Shields.io tech badges" },
  { key: "followersBadge", label: "Followers badge", hint: "GitHub followers count" },
  { key: "starsBadge", label: "Stars badge", hint: "Total stars count" },
  { key: "statsCard", label: "GitHub stats card", hint: "Commits, PRs, issues" },
  { key: "topLangsCard", label: "Top languages card", hint: "Most used languages" },
  { key: "streakCard", label: "Streak card", hint: "Current contribution streak" },
  { key: "trophies", label: "Trophy case", hint: "GitHub profile trophies" },
];

export const DEFAULT_BADGE_OPTIONS: BadgeOptions = {
  visitorBadge: true,
  languageBadges: true,
  followersBadge: false,
  starsBadge: false,
  statsCard: true,
  topLangsCard: false,
  streakCard: false,
  trophies: false,
};

export const DEFAULT_TEMPLATE = `<h1 align="center">Hi 👋, I'm {{name}}</h1>
<p align="center">{{tagline}}</p>

<p align="center">
  <img src="{{avatar}}" width="120" style="border-radius: 50%" alt="{{name}}" />
</p>

<p align="center">{{badgeRow}}</p>

## About Me

{{about}}

{{#if languageBadges}}
## Tech & Tools

<p align="center">{{languageBadges}}</p>
{{/if}}

## Featured Projects

| Project | Description | Language | Stars |
| --- | --- | --- | --- |
{{#projects}}| [{{name}}]({{url}}) | {{description}} | {{language}} | ⭐ {{stars}} |
{{/projects}}
{{#if stats}}
## GitHub Stats

<p align="center">
  {{statsCard}}
  {{topLangsCard}}
  {{streakCard}}
</p>

<p align="center">{{trophies}}</p>
{{/if}}

## Connect With Me

{{socialLinks}}
`;

export const TEMPLATE_VARIABLES: { token: string; description: string }[] = [
  { token: "{{name}}", description: "Display name" },
  { token: "{{username}}", description: "GitHub login" },
  { token: "{{tagline}}", description: "Short tagline" },
  { token: "{{about}}", description: "About me text" },
  { token: "{{avatar}}", description: "Avatar image URL" },
  { token: "{{bio}}", description: "GitHub bio" },
  { token: "{{profileUrl}}", description: "GitHub profile URL" },
  { token: "{{followers}}", description: "Follower count" },
  { token: "{{following}}", description: "Following count" },
  { token: "{{publicRepos}}", description: "Public repo count" },
  { token: "{{email}}", description: "Email address" },
  { token: "{{website}}", description: "Website URL" },
  { token: "{{twitter}}", description: "Twitter handle" },
  { token: "{{linkedIn}}", description: "LinkedIn handle" },
  { token: "{{socialLinks}}", description: "Rendered social links row" },
  { token: "{{languageBadges}}", description: "Shields.io language badges" },
  { token: "{{languageList}}", description: "Comma-separated languages" },
  { token: "{{totalStars}}", description: "Stars across all repos" },
  { token: "{{visitorBadge}}", description: "Profile views badge" },
  { token: "{{followersBadge}}", description: "Followers badge" },
  { token: "{{starsBadge}}", description: "Total stars badge" },
  { token: "{{badgeRow}}", description: "All enabled inline badges in one row" },
  { token: "{{statsCard}}", description: "GitHub stats card image" },
  { token: "{{topLangsCard}}", description: "Top languages card image" },
  { token: "{{streakCard}}", description: "Contribution streak card image" },
  { token: "{{trophies}}", description: "GitHub trophy case image" },
  {
    token: "{{#projects}} … {{/projects}}",
    description:
      "Loop over featured projects. Inside: {{name}} {{description}} {{url}} {{language}} {{stars}} {{forks}} {{topics}}",
  },
  {
    token: "{{#if stats}} … {{/if}}",
    description: "Only rendered when the GitHub stats option is on",
  },
];

function escapeAll(str: string) {
  return str;
}

export function renderTemplate(template: string, ctx: TemplateContext): string {
  const { profile, repos, featuredRepos } = ctx;
  const badges: BadgeOptions = { ...DEFAULT_BADGE_OPTIONS, ...(ctx.badges ?? {}) };
  const displayName = profile.name || profile.login;

  const languages = Array.from(
    new Set(repos.map((r) => r.language).filter(Boolean))
  ) as string[];

  const languageBadgesMarkup = languages
    .slice(0, 8)
    .map(
      (lang) =>
        `<img src="https://img.shields.io/badge/${encodeURIComponent(
          lang
        )}-333?style=flat&logo=${encodeURIComponent(
          lang.toLowerCase()
        )}" alt="${lang}" />`
    )
    .join(" ");

  const socialLinks =
    [
      ctx.twitter ? `[X / Twitter](https://x.com/${ctx.twitter})` : "",
      ctx.linkedIn ? `[LinkedIn](https://linkedin.com/in/${ctx.linkedIn})` : "",
      ctx.website
        ? `[Website](https://${ctx.website.replace(/^https?:\/\//, "")})`
        : "",
      ctx.email ? `[Email](mailto:${ctx.email})` : "",
    ]
      .filter(Boolean)
      .join(" · ") || profile.html_url;

  const scalars: Record<string, string> = {
    name: displayName,
    username: profile.login,
    tagline: ctx.tagline,
    about: ctx.about,
    avatar: profile.avatar_url,
    bio: profile.bio ?? "",
    profileUrl: profile.html_url,
    followers: String(profile.followers),
    following: String(profile.following),
    publicRepos: String(profile.public_repos),
    email: ctx.email,
    website: ctx.website,
    twitter: ctx.twitter,
    linkedIn: ctx.linkedIn,
    socialLinks,
    languageBadges,
    languageList: languages.join(", "),
    totalStars: String(
      repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    ),
    visitorBadge: `<img src="https://komarev.com/ghpvc/?username=${profile.login}&color=0e76a8" alt="profile views" />`,
  };

  const replaceScalars = (input: string, extra: Record<string, string> = {}) =>
    input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
      if (key in extra) return escapeAll(extra[key]);
      if (key in scalars) return escapeAll(scalars[key]);
      return match;
    });

  let output = template;

  // Conditional blocks: {{#if stats}} ... {{/if}}
  output = output.replace(
    /\{\{#if\s+(\w+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, body: string) => {
      const truthy =
        key === "stats"
          ? ctx.includeStats
          : key === "projects"
            ? featuredRepos.length > 0
            : Boolean(scalars[key]);
      return truthy ? body : "";
    }
  );

  // Project loop
  output = output.replace(
    /\{\{#projects\}\}([\s\S]*?)\{\{\/projects\}\}/g,
    (_match, body: string) => {
      if (!featuredRepos.length) {
        return "| _No featured projects selected yet._ | | | |\n";
      }
      return featuredRepos
        .map((r) =>
          replaceScalars(body, {
            name: r.name,
            description: (r.description || "—").replace(/\r?\n/g, " "),
            url: r.html_url,
            language: r.language || "—",
            stars: String(r.stargazers_count),
            forks: String(r.forks_count),
            topics: (r.topics || []).join(", "),
          })
        )
        .join("");
    }
  );

  return replaceScalars(output);
}
