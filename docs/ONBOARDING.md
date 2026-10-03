# Onboarding: your first day

A checklist for new contributors, including beginners. Tick things off as you go. Ask in the team
channel whenever you are stuck: that is expected.

## 1. Install the tools

- [ ] Git
- [ ] Node.js 22 (with `nvm`: `nvm install 22`, then `nvm use` inside the repo)
- [ ] A local MySQL server running on port 3306
- [ ] A code editor (VS Code is fine)
- [ ] GitHub account with access to the repo, and (optional) the `gh` CLI

Check your versions:

```bash
node -v      # v22.x
npm -v
git --version
```

## 2. Get the code and run it

- [ ] Clone the repo and open it in your editor.
- [ ] Create an empty MySQL database for yourself, for example `wit_dev`.
- [ ] Follow **Local setup** in the [README](../README.md): backend first, then frontend.
- [ ] Open `http://localhost:4000/health` (should say `OK`) and `http://localhost:5173`.
- [ ] Log in to the API with a seeded user (listed in the README). Login is not wired into the
      frontend yet, so this is done against the API directly.

If something fails, check the usual suspects: wrong Node version, `.env` missing or misspelled
(`DATABASE_URL`, `JWT_SECRET`), MySQL not running, database not created.

## 3. Find your way around

- [ ] Read [ARCHITECTURE.md](ARCHITECTURE.md).
- [ ] Read [CONTRIBUTING.md](../CONTRIBUTING.md).
- [ ] Run `grep -rn "TODO(" backend/src frontend/src` and read a few TODOs: each one is a task.

## 4. Make a first small PR

Pick something tiny, such as fixing a typo in the docs.

```bash
git switch main
git pull
git switch -c docs/fix-typo
# edit a file
git status
git diff
git add path/to/the/file
git commit -m "docs: fix typo in README"
git push -u origin docs/fix-typo
```

- [ ] Open a pull request on GitHub and fill in the template.
- [ ] Before opening it, run `npm run typecheck && npm run lint && npm run build` in any package you changed.
- [ ] Ask a teammate to review. Never push to `main` directly.
- [ ] You must be able to explain every line in your PR. If you used an AI tool, you are still responsible for it.

## Handy rules

- Never commit `.env` files or secrets.
- `npx prisma migrate reset` deletes all data in your local database. Use it only on your own dev database.
- After pulling schema changes, run `npx prisma generate` and, if needed, reset your database.
