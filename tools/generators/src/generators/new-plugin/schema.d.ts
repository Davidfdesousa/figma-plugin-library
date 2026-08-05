export interface NewPluginGeneratorSchema {
  name: string;
  purpose: string;
  capabilities: string[];
  owner: string;
  keywords?: string;
  visibility?: 'internal' | 'org';
}
