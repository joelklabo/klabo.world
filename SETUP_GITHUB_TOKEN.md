# 🚀 GitHub Token Setup - Final Steps

Your GitHub integration is deployed and ready! Now you just need to create a GitHub token and configure it.

## Quick Setup (5 minutes)

### 1️⃣ Create Your GitHub Token

1. **Open GitHub Settings**: https://github.com/settings/tokens/new
2. **Configure the token**:
   - **Note**: `KlaboWorld Blog`
   - **Expiration**: Your choice (90 days recommended)
   - **Scopes**: ✅ Check `repo` (Full control of private repositories)
3. **Click** "Generate token"
4. **COPY THE TOKEN** immediately (starts with `ghp_`)

### 2️⃣ Run the Setup Script

```bash
# In your terminal, from the project directory:
./setup-github-token.sh
```

This script will:
- Validate your token
- Configure it for local development
- Set it up in Azure production
- Test that everything works

### 3️⃣ Verify It Works

```bash
# Run the test script:
./test-github-integration.sh
```

## Manual Setup (if you prefer)

### For Azure Production:

```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
```

### For Local Development:

Create a `.env` file:
```env
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
GITHUB_OWNER=joelklabo
GITHUB_REPO=KlaboWorld
```

## How It Works

Once configured:

1. **Create a post**: Go to https://www.klabo.world/admin/compose
2. **Write your post** in the WYSIWYG editor
3. **Click Publish** - it commits directly to GitHub
4. **Automatic deployment** via GitHub Actions (~15 minutes)

## Benefits

✅ **All posts in git** - Version controlled, backed up
✅ **No database needed** - Posts are markdown files
✅ **Automatic deployment** - Push triggers deployment
✅ **History tracking** - See all changes in git log
✅ **Rollback capable** - Revert any post easily

## Troubleshooting

### Token Not Working?
- Make sure it has `repo` scope
- Check it hasn't expired
- Verify it's correctly set in Azure

### Posts Not Appearing?
- Check GitHub to see if the commit was created
- Wait for deployment to complete (~15 minutes)
- Check GitHub Actions for any errors

### Need Help?
- Check the logs: `az webapp log tail --name klabo-world-app --resource-group klabo-world-rg`
- Review GitHub Actions: https://github.com/joelklabo/KlaboWorld/actions

## Next Steps

After setting up your token:
1. Create your first post via the admin interface
2. Watch it appear in GitHub
3. See it deploy automatically

The system is designed to "just work" - write, publish, and it's live!