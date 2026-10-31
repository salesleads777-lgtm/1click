export interface Lead {
  id: string;
  timestamp: string; // ISO or formatted
  receivedAgo?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zipCode: string;
  resortDeveloper: string; // e.g. Wyndham, Westgate, Diamond Resorts, Marriott, etc.
  resortName?: string;
  annualMaintenanceFee: number;
  mortgageBalance: number;
  yearsOwned: number;
  timeshareType: 'Points' | 'Deeded Week' | 'Floating' | 'Biennial' | 'Fractional';
  sourceDomain: string; // e.g. WyndhamTimeshareCancellation.com
  landingPageUrl: string; // full URL with UTM tags
  campaignSource: string; // e.g. Google Ads - High Intent PPC, Bing Relief Funnel, Meta Retargeting
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress: string;
  intentScore: number; // 85-99%
  disputeReason: string; // e.g. "Maintenance fees tripled", "Misrepresented points value", "Perpetual clause"
  urgency: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  status: 'NEW' | 'CLAIMED' | 'CONTACTED' | 'IN_PROGRESS' | 'EXIT_SIGNED' | 'ARCHIVED';
  claimedBy?: string;
  claimedAt?: string;
  notes?: string;
  isNewArrival?: boolean; // For highlighting incoming leads
}

export interface LandingPageSite {
  domain: string;
  title: string;
  niche: string;
  preferredResorts: string[];
  activeCampaigns: number;
  monthlyTraffic: string;
}

export interface DripConfig {
  isEnabled: boolean;
  intervalSeconds: number; // e.g. 25 seconds
  enableJitter: boolean; // Add random +/- 10s variation
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  autoClaimNew: boolean;
  showToasts: boolean;
}
