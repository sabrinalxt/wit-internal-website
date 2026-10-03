# Contributing

## Branches

- Never push directly to `main`. All changes go through a pull request.
- Name branches `type/short-description`, for example `feat/proposals-api` or `fix/login-redirect`.
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## Commits

Use conventional commits: `type: short summary` in the imperative mood.

```
feat: add proposal submit endpoint
chore: untrack generated prisma client
```

Keep each commit to one logical change.

## Pull requests and review

- Fill in the PR template.
- Keep PRs small and focused on one thing.
- At least one teammate must approve before merging.
- Review within a working day where possible. Be specific and kind.
- Do not merge your own PR without a review. Resolve all comments first.
- Never commit secrets. Use `.env.example` with placeholders.

## Using AI tools

AI assistants (Claude, Copilot, etc.) are fine for drafting, explaining and debugging, with these rules:

- You are responsible for everything you submit. You must be able to explain every line.
- Read and test generated code before committing it.
- Never paste secrets, credentials or real user data into an AI tool.
- Say so in the PR if a large part of it was AI-generated.
