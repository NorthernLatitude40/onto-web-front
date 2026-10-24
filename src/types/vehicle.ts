export interface VehicleConfig {
  id?: string;
  name: string;
  cron_schedule: string;
  user_agent: string;
  concurrency: number;
  timeout: number;
  proxy: string;
  target_url: string;
  css_selector?: string;
  xpath?: string;
  regex?: string;
  json_schema?: any;
  status?: 'active' | 'inactive' | 'error';
  created_at?: string;
  updated_at?: string;
  last_run_at?: string;
  success_rate?: number;
  items_scraped?: number;
  steps?: Step[];
}

export interface VehicleConfigWithSteps extends VehicleConfig {
  steps: Step[];
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
  target_url: string;
  method: string;
  params_json: string;
  headers_json: string;
  wait_selector?: string;
  script?: string;
  parsing_rules: ParsingRule[] | { id?: string; name: string; jsonpath?: string; css_selector?: string; xpath?: string; regex?: string; output_field: string; required?: boolean }[];
  multi_parser_rules: any[];
  delay?: number;
  retry_count?: number;
  parsing_rule_name?: string;
  output_field?: string;
}