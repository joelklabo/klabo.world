# GitHub Integration for Blog Posts

This site now supports creating, editing, and deleting blog posts directly through the GitHub API. Posts are committed to the repository, ensuring they're always in version control.

## Features

- **Create posts**: Write posts in the admin interface, commit directly to GitHub
- **Edit posts**: Fetch content from GitHub, edit, and commit changes
- **Delete posts**: Remove posts from the repository via the admin interface
- **Version control**: All posts are stored in git with full history
- **Automatic deployment**: Changes trigger CI/CD pipeline for automatic deployment

## Setup

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens/new)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "KlaboWorld Blog")
4. Select the following scopes:
   - `repo` (Full control of private repositories) - needed to create/update/delete files
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### 2. Configure Environment Variables

#### For Local Development

Create a `.env` file (copy from `.env.local`):
```bash
cp .env.local .env
```

Edit `.env` and add your token:
```env
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_OWNER=joelklabo
GITHUB_REPO=KlaboWorld
```

#### For Production (Azure)

Set the environment variables in Azure:
```bash
az webapp config appsettings set \
  --name klabo-world-app \
  --resource-group klabo-world-rg \
  --settings \
    GITHUB_TOKEN="ghp_your_actual_token_here" \
    GITHUB_OWNER="joelklabo" \
    GITHUB_REPO="KlaboWorld"
```

## How It Works

### Architecture

1. **Admin Interface**: The WYSIWYG editor in `/admin/compose` for creating/editing posts
2. **GitHub Service**: Handles all GitHub API interactions
3. **Fallback Mode**: Works without GitHub token (local file system only)

### Workflow

1. **Creating a Post**:
   - Compose in the admin interface
   - Click "Publish"
   - Post is committed to `Resources/Posts/` in the repository
   - GitHub Actions automatically deploys the updated site

2. **Editing a Post**:
   - Select post from admin dashboard
   - Content is fetched from GitHub
   - Edit and save
   - Changes are committed with an update message

3. **Deleting a Post**:
   - Select post from admin dashboard
   - Click delete
   - File is removed from the repository
   - Deletion is committed

### Commit Messages

The system automatically generates descriptive commit messages:
- Create: `Add blog post: [Post Title]`
- Update: `Update blog post: [Post Title]`
- Delete: `Delete blog post: [Post Title]`

## Benefits

- **Version Control**: Full git history for all content
- **Backup**: Posts are backed up in GitHub
- **Collaboration**: Others can submit posts via pull requests
- **Rollback**: Easy to revert changes if needed
- **No Database**: Content is stored as markdown files
- **Static Generation**: Posts are baked into the Docker image

## Security Considerations

- **Token Scope**: Only grant the minimum required permissions
- **Token Rotation**: Rotate tokens periodically
- **Environment Variables**: Never commit tokens to the repository
- **HTTPS Only**: All GitHub API calls use HTTPS

## Troubleshooting

### Token Not Working
- Verify the token has `repo` scope
- Check if the token has expired
- Ensure the token is set correctly in environment variables

### Posts Not Appearing
- Check GitHub Actions deployment status
- Verify the commit was successful on GitHub
- Wait for deployment to complete (usually ~15 minutes)

### API Rate Limits
- GitHub API has rate limits (5000 requests/hour for authenticated requests)
- The integration uses minimal API calls
- Check current limits: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/rate_limit`

## Local Development Without GitHub

If you don't want to use GitHub integration during development:
1. Don't set `GITHUB_TOKEN` in your environment
2. Posts will be saved to `Resources/Posts/` locally
3. You can commit them manually when ready

## Future Enhancements

Potential improvements:
- Pull request workflow for review before publishing
- Draft/publish states
- Scheduled publishing
- Multiple author support
- Automatic image optimization
- Search functionality