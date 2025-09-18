export interface ModuleRoute {
  path: string;
  component: string;
  title: string;
  icon?: string;
}

export interface ModuleConfigSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface ModulePermissions {
  read: string[];
  write: string[];
  admin: string[];
}

export interface ModuleSpec {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'core' | 'business' | 'ui';
  routes: ModuleRoute[];
  config_schema: ModuleConfigSchema;
  capabilities: string[];
  dependencies: string[];
  permissions: ModulePermissions;
  api_endpoints?: string[];
}
