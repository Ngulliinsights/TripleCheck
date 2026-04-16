export interface RouteValidationResult {
  path: string;
  status: 'working' | 'broken' | '404';
  error?: string;
  component?: string;
  componentPath?: string;
  references?: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
}
