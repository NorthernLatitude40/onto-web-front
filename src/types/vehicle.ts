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
  last_run_at?: string;
  success_rate?: number;
  items_scraped?: number;
}

export interface ParsingRule {
  id?: string;
  name: string;
  type: 'jsonpath' | 'css' | 'xpath' | 'regex';
  expression: string;
  output_field: string;
  description?: string;
}

export interface Step {
  id: string;
  name: string;
  mode: 'api' | 'playwright';
  url: string;
  method: string;
  params_json: string;
  headers_json: string;
  wait_selector?: string;
  script?: string;
  parsing_rules: ParsingRule[];
  multi_parser_rules: any[];
}

export interface VehicleConfigWithSteps extends VehicleConfig {
  steps?: Step[];
}