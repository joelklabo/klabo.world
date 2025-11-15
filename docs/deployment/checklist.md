# Deployment Verification Checklist

## Pre-Deployment

### Local Testing
- [ ] All tests pass locally (`make test`)
- [ ] Docker image builds successfully (`make docker-build`)
- [ ] No build warnings or errors

### Configuration
- [ ] Production environment variables configured in `.env.production`
- [ ] ADMIN_PASSWORD changed from default
- [ ] SMTP settings configured for production email service
- [ ] GA_TRACKING_ID set (if using Google Analytics)

### Code Quality
- [ ] No hardcoded secrets in code
- [ ] All sensitive data uses environment variables
- [ ] File upload security implemented (UUID filenames)

### Version Control
- [ ] Latest changes committed to git
- [ ] On main branch
- [ ] Remote repository configured
- [ ] No uncommitted changes

## Local Azure Simulation

### Basic Functionality
- [ ] Run `make test-azure-local` or `docker-compose -f docker-compose.prod.yml up`
- [ ] App starts successfully on port 8080
- [ ] Home page loads without errors
- [ ] Blog posts display correctly
- [ ] Apps showcase works

### Admin Features
- [ ] Admin login works with production password
- [ ] Can create/edit/delete blog posts
- [ ] Can create/edit/delete apps
- [ ] Image upload works
- [ ] Uploaded images display correctly

### Persistence Testing
- [ ] Upload test image via admin panel
- [ ] Note the image URL
- [ ] Restart container (`docker-compose -f docker-compose.prod.yml restart`)
- [ ] Verify image still accessible at same URL
- [ ] Verify blog posts and apps still present

### Build Version
- [ ] Build version appears in footer
- [ ] Version matches git commit hash

### Email Testing (if SMTP configured)
- [ ] Contact form submission works
- [ ] Email received at configured address
- [ ] Email contains correct sender name (Joel Klabo)

## Docker Image Verification

### Build Quality
- [ ] Image builds without errors
- [ ] Image size reasonable (< 500MB)
- [ ] Multi-stage build working correctly

### Security
- [ ] Container runs as non-root user (vapor)
- [ ] No world-writable files in image
- [ ] Resources directory included and read-only
- [ ] Public directory included and read-only

### Runtime
- [ ] Container starts without errors
- [ ] Health check endpoint responds (if implemented)
- [ ] Logs show normal startup
- [ ] No permission errors in logs

## Azure Configuration

### Azure Web App
- [ ] Azure Web App created
- [ ] Linux container selected
- [ ] B1 or higher pricing tier (for always-on)
- [ ] Application settings configured:
  - [ ] WEBSITES_PORT = 8080
  - [ ] SMTP_HOST
  - [ ] SMTP_USERNAME
  - [ ] SMTP_PASSWORD
  - [ ] ADMIN_PASSWORD
  - [ ] UPLOADS_DIR = /home/site/wwwroot/uploads
  - [ ] GA_TRACKING_ID (if applicable)

### Container Registry
- [ ] GitHub Container Registry (ghcr.io) accessible
- [ ] OR Azure Container Registry configured

### Persistent Storage
- [ ] Azure Storage mounted at /home
- [ ] File share created for uploads

### Networking
- [ ] Custom domain configured (optional)
- [ ] SSL certificate configured
- [ ] CORS settings configured (if needed)

## GitHub Configuration

### Repository Settings
- [ ] AZURE_WEBAPP_PUBLISH_PROFILE secret set
- [ ] Secret contains valid publish profile from Azure
- [ ] GitHub Actions enabled

### Workflow File
- [ ] `.github/workflows/deploy.yml` exists
- [ ] Workflow triggers on push to main
- [ ] Correct Azure app name configured
- [ ] Image tagging strategy uses commit SHA

### Branch Protection (optional)
- [ ] Main branch protected
- [ ] Require PR reviews before merge
- [ ] Require status checks to pass

## Final Verification

### Automated Checks
- [ ] Run `make deploy-checklist` - all checks pass
- [ ] No errors reported
- [ ] Warnings reviewed and acceptable

### Manual Review
- [ ] Production passwords are secure
- [ ] No test data in production
- [ ] All features tested locally
- [ ] Backup plan ready if issues arise

## Post-Deployment

### Initial Verification
- [ ] GitHub Actions workflow runs successfully
- [ ] No errors in workflow logs
- [ ] Deployment completes without issues

### Site Functionality
- [ ] Site accessible at Azure URL
- [ ] Home page loads correctly
- [ ] Blog posts display
- [ ] Apps showcase works
- [ ] Search functionality works
- [ ] Mobile responsive design works

### Admin Functionality
- [ ] Admin panel accessible
- [ ] Can log in with production password
- [ ] Can create new blog post
- [ ] Can upload images
- [ ] Uploaded images persist

### Production Features
- [ ] Contact form sends emails
- [ ] Google Analytics tracking (if configured)
- [ ] Build version shows in footer
- [ ] No debug information exposed

### Performance
- [ ] Page load times acceptable
- [ ] Images load quickly
- [ ] No timeout errors
- [ ] Syntax highlighting works

### Monitoring
- [ ] Application Insights configured (optional)
- [ ] Alerts set up for downtime
- [ ] Log Analytics workspace configured
- [ ] Regular backups scheduled

## Rollback Plan

If issues occur:
1. [ ] Note the error messages
2. [ ] Check Azure Portal logs
3. [ ] Revert to previous Docker image tag if needed
4. [ ] OR redeploy last known good commit
5. [ ] Notify users if extended downtime

## Success Criteria

All items checked = Ready for production! 🚀