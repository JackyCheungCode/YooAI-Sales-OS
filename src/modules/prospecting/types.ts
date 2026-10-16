export type ProspectingChannel = 'maps' | 'web-search' | 'company-sites' | 'linkedin' | 'facebook' | 'import';

export type ProspectingRequest = {
  countries: string;
  industry: string;
  customerType: string;
  keywords: string;
  targetCount: number;
  channels: ProspectingChannel[];
};

export type ProspectingPlan = {
  title: string;
  criteria: string[];
  channelNames: string[];
  steps: string[];
  limitations: string[];
  generatedAt: string;
};
