# Service Names Update

## Summary of Changes

This document outlines the changes made to update the service names for the admin panel infrastructure.

## Updated Configuration

### 1. Environment-Specific Service Names

| Environment | Old Service Name | New Service Name | Cluster Name |
|-------------|------------------|------------------|--------------|
| Development | `AdminPanelDevelopmentStackService-1` | `admin-panel-service-development` | `admin-panel-development` |
| Production | `AdminPanelProductionStackService-1` | `admin-panel-service-production` | `admin-panel-production` |
| Release | `AdminPanelReleaseStackService-1` | `admin-panel-service-release` | `admin-panel-release` |

### 2. Files Updated

#### CDK Infrastructure Files

1. **`python-cdk-v2/python_cdk/python_cdk_stack.py`**
   - Added `service_name` configuration for each environment
   - Updated Fargate service creation to use explicit service names
   - Removed auto-generated service names with timestamps

#### GitHub Actions Workflows

1. **`.github/workflows/deploy-development.yml`**
   - Updated ECS service references: `admin-panel-service-development`
   - Simplified service name resolution

2. **`.github/workflows/deploy-production.yml`**
   - Updated ECS service references: `admin-panel-service-production`
   - Simplified service name resolution

3. **`.github/workflows/deploy-release.yml`**
   - Updated ECS service references: `admin-panel-service-release`
   - Simplified service name resolution

## Benefits of These Changes

### 1. **Predictable Service Names**
- No more auto-generated service names that change between deployments
- Easy to identify services in AWS Console
- Consistent naming across environments

### 2. **Simplified Operations**
- Direct service name references in scripts and workflows
- No need to query CloudFormation for service names
- Easier debugging and troubleshooting

### 3. **Better Resource Management**
- Clear separation between environments
- Easier to manage permissions and policies
- Simplified monitoring and logging

## Deployment Instructions

### Using CDK Directly

```bash
# Development
cdk deploy --context environment=development

# Production
cdk deploy --context environment=production

# Release
cdk deploy --context environment=release
```

### Using GitHub Actions

The GitHub Actions workflows will automatically use the new service names:
- Push to `main` branch → Deploy to `admin-panel-service-development`
- Push to `production` branch → Deploy to `admin-panel-service-production`
- Push to `release-*` branch → Deploy to `admin-panel-service-release`

## Migration Notes

### For Existing Deployments

1. **First Deployment**: The first deployment with the new configuration will create new services with the specified names
2. **Old Services**: Old auto-generated services will remain but can be cleaned up after confirming new deployments work
3. **Data Migration**: No data migration needed as this only affects infrastructure naming

### Verification Steps

After deployment, verify:
1. New services are created with correct names
2. Services are running in the new clusters
3. Load balancers are properly configured
4. Health checks are passing
5. Applications are accessible

## Rollback Plan

If issues occur:
1. Revert the CDK code changes
2. Redeploy using the old configuration
3. The old auto-generated service names will be used again

## Future Considerations

1. **Monitoring**: Update monitoring dashboards to use new service names
2. **Logging**: Ensure log groups and filters use new service names
3. **Documentation**: Update any internal documentation referencing service names
4. **Scripts**: Update any custom scripts that reference service names

## Complete Resource Naming Convention

| Resource Type | Development | Production | Release |
|---------------|-------------|------------|---------|
| Cluster | `admin-panel-development` | `admin-panel-production` | `admin-panel-release` |
| Service | `admin-panel-service-development` | `admin-panel-service-production` | `admin-panel-service-release` |
| Stack | `AdminPanelDevelopmentStack` | `AdminPanelProductionStack` | `AdminPanelReleaseStack` |
