
// Import and instantiate the admin services
import { statsService } from './StatsService';
import { loggingService } from './LoggingService';
import { featureService } from './FeatureService';
import { userManagementService } from './UserManagementService';

// Export individual service instances for global access
export { statsService } from './StatsService';
export { loggingService } from './LoggingService';
export { featureService } from './FeatureService';
export { userManagementService } from './UserManagementService';

// Export a global "adminService" object for broader app use/legacy
export const adminService = {
  getInstance: () => ({
    getDashboardStats: statsService.getDashboardStats.bind(statsService),
    logAdminAction: loggingService.logAdminAction.bind(loggingService),
    createAdminAction: loggingService.createAdminAction.bind(loggingService),
    toggleFeature: featureService.toggleFeature.bind(featureService),
    restrictUser: userManagementService.restrictUser.bind(userManagementService),
    getUserActivities: userManagementService.getUserActivities.bind(userManagementService),
    updateUserRole: userManagementService.updateUserRole.bind(userManagementService),
    deleteUser: userManagementService.deleteUser.bind(userManagementService),
    getAllFeatureFlags: featureService.getAllFeatureFlags.bind(featureService),
    getUserRestrictions: userManagementService.getUserRestrictions.bind(userManagementService),
    trackUserActivity: userManagementService.trackUserActivity.bind(userManagementService),
    getAdminLogs: loggingService.getAdminLogs.bind(loggingService),
  }),
};
