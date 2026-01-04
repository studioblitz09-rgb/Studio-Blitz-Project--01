---
description: Deploying Studio Blitz to GitHub Pages
---

# Deployment Guide

### 1. Push to GitHub
Run these in your terminal:
```bash
git init
git add .
git commit -m "Deploying to Cloud"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2. Configure GitHub Pages
- Go to Repository **Settings** > **Pages**.
- Set Source to **Deploy from a branch**.
- Select **main** branch and **/** (root) folder.
- Hit **Save**.

### 3. Firebase Whitelist (IMPORTANT)
Your database will block the hosted site unless you authorize the domain:
- Go to **Firebase Console** > **Authentication** > **Settings**.
- Add `<USERNAME>.github.io` to the **Authorized Domains** list.

### 4. Verification
- Visit `https://<USERNAME>.github.io/<REPO_NAME>/`
- Check the "Intelligence Feed" or a "Product Page" to ensure Cloud Sync shows "SUCCESS" in the console.
