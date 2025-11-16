# Staging Environment Strategy

This document outlines the strategy and process for utilizing the staging environment to ensure safe and reliable deployments to production.

## Purpose of the Staging Environment

The staging environment (`klabo-world-staging`) is a near-production replica of the application. Its primary purposes are:

-   **Pre-production Testing:** To perform final integration, system, and user acceptance testing (UAT) in an environment that closely mirrors production.
-   **Performance Testing:** To conduct load and performance tests to ensure the application can handle expected traffic.
-   **Security Scans:** To run security vulnerability scans against a deployed instance of the application.
-   **Demonstrations:** To provide a stable environment for stakeholder demonstrations and reviews.
-   **Rollback Strategy Validation:** To validate the rollback process before a production deployment.

## Deployment Process to Staging

Changes are deployed to the staging slot automatically via the `deploy.yml` GitHub Actions workflow upon every push to the `main` branch.

1.  **Code Push:** A developer pushes code to the `main` branch.
2.  **CI Workflow (`ci.yml`):** The CI workflow runs unit tests, linting, and builds the application. If successful, it proceeds to the deploy workflow.
3.  **Build Docker Image:** The `deploy.yml` workflow builds a Docker image of the application, tagged with the Git commit SHA.
4.  **Deploy to Staging Slot:** The Docker image is deployed to the Azure App Service staging slot (`klabo-world-staging`).
5.  **Post-Deploy Smoke Tests:** Automated smoke tests (e.g., `curl /api/health`, a subset of Playwright tests) are executed against the staging environment to ensure basic functionality.

## Testing in Staging

Once deployed to staging, the following testing activities should be performed:

-   **Automated Tests:** All automated end-to-end (Playwright) tests should be run against the staging environment.
-   **Manual QA/UAT:** Manual quality assurance and user acceptance testing should be performed by the relevant stakeholders.
-   **Performance Testing:** Load tests (e.g., using `k6`) should be executed to validate performance under load.
-   **Security Testing:** Any required security scans or penetration tests should be conducted.

## Promotion to Production

Promotion from staging to production is a controlled process, typically involving a slot swap in Azure App Service.

1.  **Staging Approval:** All testing in the staging environment must pass, and relevant stakeholders must provide their approval.
2.  **Production Slot Swap:** The staging slot is swapped with the production slot. This is an instant operation that redirects traffic to the previously staged application.
3.  **Post-Swap Smoke Tests:** A quick set of smoke tests are run against the production environment immediately after the swap to verify the deployment.
4.  **Monitoring:** Closely monitor production metrics and logs for any anomalies after the swap.

## Rollback Strategy

In case of issues in production after a deployment, a rollback can be initiated by swapping the slots back or deploying a previous stable image.

-   **Immediate Rollback:** If critical issues are detected immediately after a swap, the staging and production slots can be swapped back to revert to the previous production version.
-   **Previous Image Deployment:** For more complex scenarios, a specific previous stable Docker image can be deployed directly to the production slot.

## Environment Configuration

The staging environment uses its own set of configuration and secrets, which are managed in Azure Key Vault and App Service Application Settings, mirroring the production setup but with staging-specific values.
