import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generatePortfolioMarkdown } from "./github";
import {
  getUserProfile,
  getUserRepos,
  getReadme,
  putReadme,
} from "./github.server";

export const fetchProfile = createServerFn({ method: "POST" })
  .validator((data) => z.object({ username: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    return getUserProfile(data.username);
  });

export const fetchRepos = createServerFn({ method: "POST" })
  .validator((data) => z.object({ username: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    return getUserRepos(data.username);
  });

export const fetchReadme = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({ owner: z.string().min(1), repo: z.string().min(1) }).parse(data)
  )
  .handler(async ({ data }) => {
    return getReadme(data.owner, data.repo);
  });

export const updateReadme = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        message: z.string().min(1),
        content: z.string(),
        sha: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    return putReadme(data.owner, data.repo, data.message, data.content, data.sha);
  });

export { generatePortfolioMarkdown };
