export interface VehicleConfig {
  id?: string;
  name: string;
  cron_schedule: string;
  user_agent: string;
  concurrency: number;
  timeout: number;
  proxy: string;
  target_url: string;
  status?: 'active' | 'inactive' | 'error';
  created_at?: string;
  updated_at?: string;
}