export const APP_FEATURES = {
  MESSAGING: 'messaging',
  FILE_SHARING: 'file_sharing',
  GROUP_CREATION: 'group_creation',
  STORY_SHARING: 'story_sharing',
  BUSINESS_FEATURES: 'business_features',
  MARKETPLACE: 'marketplace',
  REAL_ESTATE: 'real_estate',
  TAXI_SERVICE: 'taxi_service',
  FOOD_DELIVERY: 'food_delivery',
  JOB_POSTING: 'job_posting',
  EVENT_CREATION: 'event_creation',
  USER_VERIFICATION: 'user_verification',
  CONTENT_MODERATION: 'content_moderation',
  ANALYTICS: 'analytics',
  USER_MANAGEMENT: 'user_management',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

export type FeatureName = keyof typeof APP_FEATURES;

export const FEATURE_DESCRIPTIONS = {
  [APP_FEATURES.MESSAGING]: 'Enable/disable direct messaging between users',
  [APP_FEATURES.FILE_SHARING]: 'Allow users to share files and media',
  [APP_FEATURES.GROUP_CREATION]: 'Allow users to create and manage groups',
  [APP_FEATURES.STORY_SHARING]: 'Enable/disable story sharing feature',
  [APP_FEATURES.BUSINESS_FEATURES]: 'Access to business-related features',
  [APP_FEATURES.MARKETPLACE]: 'Enable/disable marketplace functionality',
  [APP_FEATURES.REAL_ESTATE]: 'Access to real estate listings and features',
  [APP_FEATURES.TAXI_SERVICE]: 'Enable/disable taxi service features',
  [APP_FEATURES.FOOD_DELIVERY]: 'Access to food delivery features',
  [APP_FEATURES.JOB_POSTING]: 'Allow posting and applying for jobs',
  [APP_FEATURES.EVENT_CREATION]: 'Enable/disable event creation and management',
  [APP_FEATURES.USER_VERIFICATION]: 'Enable/disable user verification system',
  [APP_FEATURES.CONTENT_MODERATION]: 'Control and moderate user-generated content',
  [APP_FEATURES.ANALYTICS]: 'Access detailed analytics and reporting',
  [APP_FEATURES.USER_MANAGEMENT]: 'Manage users, roles, and permissions',
  [APP_FEATURES.SYSTEM_SETTINGS]: 'Control system-wide settings and configurations',
};
