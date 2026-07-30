Build a GitHub profile README portfolio generator

Goal: let you create and update a portfolio-style GitHub profile README (`username/username`) from this app.

## Proposed flow
1. Connect the GitHub connector to this project so we can read your profile and write the README.
2. Ask for your GitHub username and confirm/read your target profile repo.
3. Pull public GitHub data (bio, top repos, languages, stars, recent work) through the connector.
4. Generate a starter README with a clear portfolio structure: hero intro, about, featured projects, skills, stats, contact.
5. Render a live preview side-by-side with a Markdown editor so you can edit copy, pick projects, reorder, and choose a visual style.
6. Commit the final README back to `https://github.com/username/username` (create the repo if it doesn't exist).

## Scope / assumptions
- The portfolio content is sourced from your public GitHub data plus editable text fields.
- One README theme is included in this first version (clean, minimal, badge-friendly).
- Authentication is handled through Lovable's managed GitHub connector (no manual PAT needed during dev).
- If the profile repo is missing, the app will offer to create it before writing.

## Current state
- This is a fresh TanStack Start project with an empty index page.
- No GitHub workspace connection is linked yet; the first step is to set that up.

## Technical outline
- Route: `/` (portfolio builder)
- Server function: fetch GitHub profile + repos via the connector gateway
- Server function: commit README to the target repo via the GitHub contents API
- UI: two-pane layout — Markdown preview + editor/form controls
- State: local React state for draft README; no database needed

## Open questions
- Any specific sections or links you want to force-include/exclude?
- Do you want to handle the profile repo creation, or should the app only update an existing repo?
