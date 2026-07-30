Update the portfolio builder's default target repo and publish the generated README to `vardhan23v/vardhan23v`.

Plan

1. Update the default target repository
   - Change the `targetInput` state default in `src/routes/index.tsx` from `vardhan23v/my-github-access` to `vardhan23v/vardhan23v`.
   - This makes the builder open with the profile README repo as the default destination.

2. Verify the target repo's README state
   - Use the existing `getReadme` server function to check whether `README.md` already exists in `vardhan23v/vardhan23v`.
   - If a README exists, capture its SHA so the publish step can update it; if not, the publish step will create it.

3. Publish the generated portfolio README
   - Generate the same README markdown currently shown in the preview.
   - Call `putReadme` through the connector gateway to commit the markdown to `vardhan23v/vardhan23v/README.md` with a clear commit message like `Update portfolio README`.
   - Confirm the published file URL and report it back.

Technical details

- The GitHub connector is already linked, so `GITHUB_API_KEY` and `LOVABLE_API_KEY` are available for gateway calls.
- The existing server functions in `src/lib/github.functions.ts` handle profile fetching, repo listing, README reading, and README writing.
- The commit will either create a new `README.md` or overwrite an existing one; GitHub's Contents API requires the current SHA when updating.
- After the publish, the builder UI will remain available for further edits.
