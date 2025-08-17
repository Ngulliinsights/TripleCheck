export interface EventHandler {
  name: string;
  type: string;
  code: string;
}

export interface APICall {
  endpoint: string;
  method: string;
}
