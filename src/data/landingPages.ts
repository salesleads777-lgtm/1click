import { LandingPageSite, Lead } from '../types/lead';

export interface UserLandingPage {
  slug: string;
  url: string;
  displayUrl: string;
  category: 'Developer & Resort' | 'Location & Destination' | 'State Law' | 'Legal & Situational';
  title: string;
  resortMatch?: string[];
  stateMatch?: string[];
}

export const USER_LANDING_PAGES: UserLandingPage[] = [
  // 1. Legal, Situational & Emergency Relief Funnels
  {
    slug: 'perpetual-contract-relief',
    url: 'https://timeshare.click/perpetual-contract-relief',
    displayUrl: 'timeshare.click/perpetual-contract-relief',
    category: 'Legal & Situational',
    title: 'Perpetual Contract & Forever Clause Relief',
  },
  {
    slug: 'veteran-timeshare-relief',
    url: 'https://timeshare.click/veteran-timeshare-relief',
    displayUrl: 'timeshare.click/veteran-timeshare-relief',
    category: 'Legal & Situational',
    title: 'US Military & Veteran Timeshare Relief Bureau',
  },
  {
    slug: 'widow-timeshare-release',
    url: 'https://timeshare.click/widow-timeshare-release',
    displayUrl: 'timeshare.click/widow-timeshare-release',
    category: 'Legal & Situational',
    title: 'Surviving Spouse & Widow Deed Release Helpdesk',
  },
  {
    slug: 'divorce-timeshare-removal',
    url: 'https://timeshare.click/divorce-timeshare-removal',
    displayUrl: 'timeshare.click/divorce-timeshare-removal',
    category: 'Legal & Situational',
    title: 'Marital Dissolution & Divorce Timeshare Removal',
  },
  {
    slug: 'bankruptcy-timeshare-surrender',
    url: 'https://timeshare.click/bankruptcy-timeshare-surrender',
    displayUrl: 'timeshare.click/bankruptcy-timeshare-surrender',
    category: 'Legal & Situational',
    title: 'Chapter 7/13 Timeshare Surrender & Debt Relief',
  },
  {
    slug: 'fixed-income-timeshare-relief',
    url: 'https://timeshare.click/fixed-income-timeshare-relief',
    displayUrl: 'timeshare.click/fixed-income-timeshare-relief',
    category: 'Legal & Situational',
    title: 'Senior Citizen & Fixed Income Dues Cancellation',
  },
  {
    slug: 'stop-timeshare-collections',
    url: 'https://timeshare.click/stop-timeshare-collections',
    displayUrl: 'timeshare.click/stop-timeshare-collections',
    category: 'Legal & Situational',
    title: 'Cease & Desist Timeshare Collections Harassment',
  },
  {
    slug: 'timeshare-scam-recovery',
    url: 'https://timeshare.click/timeshare-scam-recovery',
    displayUrl: 'timeshare.click/timeshare-scam-recovery',
    category: 'Legal & Situational',
    title: 'Secondary Market Scam Audit & Recovery Funnel',
  },
  {
    slug: 'timeshare-points-conversion-trap',
    url: 'https://timeshare.click/timeshare-points-conversion-trap',
    displayUrl: 'timeshare.click/timeshare-points-conversion-trap',
    category: 'Legal & Situational',
    title: 'Deed to Points Conversion Trap Resolution',
  },
  {
    slug: 'annual-fee-hike-cancellation',
    url: 'https://timeshare.click/annual-fee-hike-cancellation',
    displayUrl: 'timeshare.click/annual-fee-hike-cancellation',
    category: 'Legal & Situational',
    title: 'Escalating Maintenance Fee Hike Cancellation',
  },
  {
    slug: 'unconscionable-contract-relief',
    url: 'https://timeshare.click/unconscionable-contract-relief',
    displayUrl: 'timeshare.click/unconscionable-contract-relief',
    category: 'Legal & Situational',
    title: 'Unconscionable Consumer Contract Severance',
  },
  {
    slug: 'false-oral-promise-rescission',
    url: 'https://timeshare.click/false-oral-promise-rescission',
    displayUrl: 'timeshare.click/false-oral-promise-rescission',
    category: 'Legal & Situational',
    title: 'Sales Presentation False Oral Promise Rescission',
  },
  {
    slug: 'timeshare-attorney-review',
    url: 'https://timeshare.click/timeshare-attorney-review',
    displayUrl: 'timeshare.click/timeshare-attorney-review',
    category: 'Legal & Situational',
    title: 'Attorney-Backed Timeshare Contract Review',
  },
  {
    slug: 'deed-in-lieu-reconveyance',
    url: 'https://timeshare.click/deed-in-lieu-reconveyance',
    displayUrl: 'timeshare.click/deed-in-lieu-reconveyance',
    category: 'Legal & Situational',
    title: 'Deed-in-Lieu Legal Reconveyance Direct to Resort',
  },
  {
    slug: 'urgent-timeshare-escape',
    url: 'https://timeshare.click/urgent-timeshare-escape',
    displayUrl: 'timeshare.click/urgent-timeshare-escape',
    category: 'Legal & Situational',
    title: 'Urgent 24-Hour Timeshare Escape Qualification',
  },
  {
    slug: 'guaranteed-escrow-timeshare-exit',
    url: 'https://timeshare.click/guaranteed-escrow-timeshare-exit',
    displayUrl: 'timeshare.click/guaranteed-escrow-timeshare-exit',
    category: 'Legal & Situational',
    title: '100% Guaranteed Escrow Protected Timeshare Exit',
  },

  // 2. Developer & Resort Funnels
  {
    slug: 'silverleaf-resorts-exit',
    url: 'https://timeshare.click/silverleaf-resorts-exit',
    displayUrl: 'timeshare.click/silverleaf-resorts-exit',
    category: 'Developer & Resort',
    title: 'Silverleaf Resorts Contract Exit & Deed Relinquishment',
    resortMatch: ['silverleaf', 'holiday inn orange lake silverleaf', 'holly lake', 'fox river'],
  },
  {
    slug: 'spinnaker-resorts-exit',
    url: 'https://timeshare.click/spinnaker-resorts-exit',
    displayUrl: 'timeshare.click/spinnaker-resorts-exit',
    category: 'Developer & Resort',
    title: 'Spinnaker Resorts Timeshare Exit & Dues Cancellation',
    resortMatch: ['spinnaker', 'spinnaker resorts', 'waterside by spinnaker', 'bluewater resort'],
  },
  {
    slug: 'shell-vacations-club-exit',
    url: 'https://timeshare.click/shell-vacations-club-exit',
    displayUrl: 'timeshare.click/shell-vacations-club-exit',
    category: 'Developer & Resort',
    title: 'Shell Vacations Club (SVC) Contract Termination',
    resortMatch: ['shell', 'shell vacations club', 'svc', 'wyndham shell'],
  },
  {
    slug: 'festiva-resorts-exit',
    url: 'https://timeshare.click/festiva-resorts-exit',
    displayUrl: 'timeshare.click/festiva-resorts-exit',
    category: 'Developer & Resort',
    title: 'Festiva Resorts & Adventure Club Exit Portal',
    resortMatch: ['festiva', 'festiva adventure club', 'festiva resorts'],
  },
  {
    slug: 'grandview-las-vegas-exit',
    url: 'https://timeshare.click/grandview-las-vegas-exit',
    displayUrl: 'timeshare.click/grandview-las-vegas-exit',
    category: 'Developer & Resort',
    title: 'Grandview at Las Vegas Timeshare Relinquishment',
    resortMatch: ['grandview', 'grandview at las vegas', 'eldorado resorts'],
  },
  {
    slug: 'tahiti-village-exit',
    url: 'https://timeshare.click/tahiti-village-exit',
    displayUrl: 'timeshare.click/tahiti-village-exit',
    category: 'Developer & Resort',
    title: 'Tahiti Village Las Vegas Timeshare Exit & Cancellation',
    resortMatch: ['tahiti village', 'consolidated resorts', 'tahiti resort'],
  },
  {
    slug: 'exploria-resorts-exit',
    url: 'https://timeshare.click/exploria-resorts-exit',
    displayUrl: 'timeshare.click/exploria-resorts-exit',
    category: 'Developer & Resort',
    title: 'Exploria Resorts & Summer Bay Contract Relief',
    resortMatch: ['exploria', 'summer bay', 'exploria resorts', 'crown club'],
  },
  {
    slug: 'legacy-vacation-resorts-exit',
    url: 'https://timeshare.click/legacy-vacation-resorts-exit',
    displayUrl: 'timeshare.click/legacy-vacation-resorts-exit',
    category: 'Developer & Resort',
    title: 'Legacy Vacation Resorts Contract Cancellation',
    resortMatch: ['legacy', 'legacy vacation', 'legacy vacation resorts'],
  },
  {
    slug: 'vidanta-timeshare-exit',
    url: 'https://timeshare.click/vidanta-timeshare-exit',
    displayUrl: 'timeshare.click/vidanta-timeshare-exit',
    category: 'Developer & Resort',
    title: 'Grupo Vidanta (Grand Mayan / Grand Luxxe) Exit Bureau',
    resortMatch: ['vidanta', 'grupo vidanta', 'grand mayan', 'grand bliss', 'grand luxxe'],
  },
  {
    slug: 'pueblo-bonito-exit',
    url: 'https://timeshare.click/pueblo-bonito-exit',
    displayUrl: 'timeshare.click/pueblo-bonito-exit',
    category: 'Developer & Resort',
    title: 'Pueblo Bonito Golf & Spa Resorts Cancellation',
    resortMatch: ['pueblo bonito', 'pueblo bonito sunset beach', 'rosé'],
  },
  {
    slug: 'palace-resorts-exit',
    url: 'https://timeshare.click/palace-resorts-exit',
    displayUrl: 'timeshare.click/palace-resorts-exit',
    category: 'Developer & Resort',
    title: 'Palace Premier & Palace Resorts Timeshare Exit',
    resortMatch: ['palace', 'palace resorts', 'moon palace', 'palace premier'],
  },
  {
    slug: 'el-cid-vacations-exit',
    url: 'https://timeshare.click/el-cid-vacations-exit',
    displayUrl: 'timeshare.click/el-cid-vacations-exit',
    category: 'Developer & Resort',
    title: 'El Cid Vacations Club Contract Release & Escrow',
    resortMatch: ['el cid', 'el cid vacations club'],
  },
  {
    slug: 'divi-resorts-exit',
    url: 'https://timeshare.click/divi-resorts-exit',
    displayUrl: 'timeshare.click/divi-resorts-exit',
    category: 'Developer & Resort',
    title: 'Divi Resorts Caribbean Timeshare Relinquishment',
    resortMatch: ['divi', 'divi resorts', 'divi village', 'divi aruba'],
  },
  {
    slug: 'rci-points-cancellation',
    url: 'https://timeshare.click/rci-points-cancellation',
    displayUrl: 'timeshare.click/rci-points-cancellation',
    category: 'Developer & Resort',
    title: 'RCI Exchange & Subscribed Points Cancellation',
    resortMatch: ['rci', 'resort condominiums international', 'rci points'],
  },
  {
    slug: 'interval-international-exit',
    url: 'https://timeshare.click/interval-international-exit',
    displayUrl: 'timeshare.click/interval-international-exit',
    category: 'Developer & Resort',
    title: 'Interval International (II) Exchange Membership Exit',
    resortMatch: ['interval', 'interval international', 'worldpass'],
  },
  {
    slug: 'hyatt-residence-club-exit',
    url: 'https://timeshare.click/hyatt-residence-club-exit',
    displayUrl: 'timeshare.click/hyatt-residence-club-exit',
    category: 'Developer & Resort',
    title: 'Hyatt Residence Club & Vacation Ownership Exit',
    resortMatch: ['hyatt', 'hyatt residence club', 'hyatt vacation club'],
  },
  {
    slug: 'sheraton-broadway-exit',
    url: 'https://timeshare.click/sheraton-broadway-exit',
    displayUrl: 'timeshare.click/sheraton-broadway-exit',
    category: 'Developer & Resort',
    title: 'Sheraton Broadway Plantation & Vistana Exit',
    resortMatch: ['sheraton broadway', 'sheraton plantation', 'sheraton'],
  },
  {
    slug: 'westin-vacation-club-exit',
    url: 'https://timeshare.click/westin-vacation-club-exit',
    displayUrl: 'timeshare.click/westin-vacation-club-exit',
    category: 'Developer & Resort',
    title: 'Westin Vacation Club & Nanea Ocean Villas Exit',
    resortMatch: ['westin', 'westin vacation club', 'westin kierland', 'westin nanea'],
  },
  {
    slug: 'daily-management-resorts-exit',
    url: 'https://timeshare.click/daily-management-resorts-exit',
    displayUrl: 'timeshare.click/daily-management-resorts-exit',
    category: 'Developer & Resort',
    title: 'Daily Management Resorts & Vacation Break Relief',
    resortMatch: ['daily management', 'dmr', 'ocean walk'],
  },
  {
    slug: 'qvc-timeshare-exit',
    url: 'https://timeshare.click/qvc-timeshare-exit',
    displayUrl: 'timeshare.click/qvc-timeshare-exit',
    category: 'Developer & Resort',
    title: 'Quality Vacation Club (QVC) Timeshare Contract Rescission',
    resortMatch: ['qvc', 'quality vacation club', 'qvvc'],
  },
  {
    slug: 'patriot-timeshare-exit',
    url: 'https://timeshare.click/patriot-timeshare-exit',
    displayUrl: 'timeshare.click/patriot-timeshare-exit',
    category: 'Developer & Resort',
    title: 'Patriot Resorts & Vacation Ownership Contract Exit',
    resortMatch: ['patriot', 'patriot resorts'],
  },
  {
    slug: 'manhattan-resort-exit',
    url: 'https://timeshare.click/manhattan-resort-exit',
    displayUrl: 'timeshare.click/manhattan-resort-exit',
    category: 'Developer & Resort',
    title: 'Manhattan Club NYC Fractional Deed Release',
    resortMatch: ['manhattan club', 'manhattan club nyc', 'manhattan resort'],
  },
  {
    slug: 'calypso-cay-resorts-exit',
    url: 'https://timeshare.click/calypso-cay-resorts-exit',
    displayUrl: 'timeshare.click/calypso-cay-resorts-exit',
    category: 'Developer & Resort',
    title: 'Calypso Cay Resort Kissimmee Timeshare Relinquishment',
    resortMatch: ['calypso cay', 'calypso cay resort'],
  },
  {
    slug: 'crown-resorts-exit',
    url: 'https://timeshare.click/crown-resorts-exit',
    displayUrl: 'timeshare.click/crown-resorts-exit',
    category: 'Developer & Resort',
    title: 'Crown Resorts Club & Australian/US Ownership Exit',
    resortMatch: ['crown', 'crown resorts', 'crown club'],
  },

  // 3. Destination & Regional Funnels
  {
    slug: 'orlando-timeshare-exit',
    url: 'https://timeshare.click/orlando-timeshare-exit',
    displayUrl: 'timeshare.click/orlando-timeshare-exit',
    category: 'Location & Destination',
    title: 'Orlando Central Florida Timeshare Contract Cancellation',
    stateMatch: ['FL'],
  },
  {
    slug: 'las-vegas-timeshare-exit',
    url: 'https://timeshare.click/las-vegas-timeshare-exit',
    displayUrl: 'timeshare.click/las-vegas-timeshare-exit',
    category: 'Location & Destination',
    title: 'Las Vegas Strip & Nevada Timeshare Relinquishment',
    stateMatch: ['NV'],
  },
  {
    slug: 'myrtle-beach-timeshare-exit',
    url: 'https://timeshare.click/myrtle-beach-timeshare-exit',
    displayUrl: 'timeshare.click/myrtle-beach-timeshare-exit',
    category: 'Location & Destination',
    title: 'Myrtle Beach Grand Strand Timeshare Contract Relief',
    stateMatch: ['SC'],
  },
  {
    slug: 'gatlinburg-timeshare-exit',
    url: 'https://timeshare.click/gatlinburg-timeshare-exit',
    displayUrl: 'timeshare.click/gatlinburg-timeshare-exit',
    category: 'Location & Destination',
    title: 'Gatlinburg & Pigeon Forge Smoky Mountains Timeshare Exit',
    stateMatch: ['TN'],
  },
  {
    slug: 'branson-timeshare-exit',
    url: 'https://timeshare.click/branson-timeshare-exit',
    displayUrl: 'timeshare.click/branson-timeshare-exit',
    category: 'Location & Destination',
    title: 'Branson Missouri Ozarks Timeshare Relinquishment',
    stateMatch: ['MO'],
  },
  {
    slug: 'maui-timeshare-exit',
    url: 'https://timeshare.click/maui-timeshare-exit',
    displayUrl: 'timeshare.click/maui-timeshare-exit',
    category: 'Location & Destination',
    title: 'Maui Hawaii Luxury Timeshare & Maintenance Relief',
    stateMatch: ['HI'],
  },
  {
    slug: 'honolulu-timeshare-exit',
    url: 'https://timeshare.click/honolulu-timeshare-exit',
    displayUrl: 'timeshare.click/honolulu-timeshare-exit',
    category: 'Location & Destination',
    title: 'Honolulu & Oahu Hawaii Timeshare Deed Termination',
    stateMatch: ['HI'],
  },
  {
    slug: 'lake-tahoe-timeshare-exit',
    url: 'https://timeshare.click/lake-tahoe-timeshare-exit',
    displayUrl: 'timeshare.click/lake-tahoe-timeshare-exit',
    category: 'Location & Destination',
    title: 'Lake Tahoe Sierra Nevada Timeshare Relief Portal',
    stateMatch: ['CA', 'NV'],
  },
  {
    slug: 'hilton-head-timeshare-exit',
    url: 'https://timeshare.click/hilton-head-timeshare-exit',
    displayUrl: 'timeshare.click/hilton-head-timeshare-exit',
    category: 'Location & Destination',
    title: 'Hilton Head Island South Carolina Deed Termination',
    stateMatch: ['SC'],
  },
  {
    slug: 'sedona-timeshare-exit',
    url: 'https://timeshare.click/sedona-timeshare-exit',
    displayUrl: 'timeshare.click/sedona-timeshare-exit',
    category: 'Location & Destination',
    title: 'Sedona Red Rock Arizona Timeshare Exit Funnel',
    stateMatch: ['AZ'],
  },
  {
    slug: 'williamsburg-timeshare-exit',
    url: 'https://timeshare.click/williamsburg-timeshare-exit',
    displayUrl: 'timeshare.click/williamsburg-timeshare-exit',
    category: 'Location & Destination',
    title: 'Historic Williamsburg Virginia Timeshare Relinquishment',
    stateMatch: ['VA'],
  },
  {
    slug: 'breckenridge-timeshare-exit',
    url: 'https://timeshare.click/breckenridge-timeshare-exit',
    displayUrl: 'timeshare.click/breckenridge-timeshare-exit',
    category: 'Location & Destination',
    title: 'Breckenridge Colorado Ski Timeshare Contract Relief',
    stateMatch: ['CO'],
  },
  {
    slug: 'park-city-timeshare-exit',
    url: 'https://timeshare.click/park-city-timeshare-exit',
    displayUrl: 'timeshare.click/park-city-timeshare-exit',
    category: 'Location & Destination',
    title: 'Park City Utah Ski Resort Timeshare Cancellation',
    stateMatch: ['UT'],
  },
  {
    slug: 'key-west-timeshare-exit',
    url: 'https://timeshare.click/key-west-timeshare-exit',
    displayUrl: 'timeshare.click/key-west-timeshare-exit',
    category: 'Location & Destination',
    title: 'Key West & Florida Keys Timeshare Exit Intake',
    stateMatch: ['FL'],
  },
  {
    slug: 'atlantic-city-timeshare-exit',
    url: 'https://timeshare.click/atlantic-city-timeshare-exit',
    displayUrl: 'timeshare.click/atlantic-city-timeshare-exit',
    category: 'Location & Destination',
    title: 'Atlantic City Boardwalk New Jersey Timeshare Relinquishment',
    stateMatch: ['NJ'],
  },
  {
    slug: 'daytona-beach-timeshare-exit',
    url: 'https://timeshare.click/daytona-beach-timeshare-exit',
    displayUrl: 'timeshare.click/daytona-beach-timeshare-exit',
    category: 'Location & Destination',
    title: 'Daytona Beach Oceanfront Timeshare Contract Relief',
    stateMatch: ['FL'],
  },
  {
    slug: 'cabo-san-lucas-exit',
    url: 'https://timeshare.click/cabo-san-lucas-exit',
    displayUrl: 'timeshare.click/cabo-san-lucas-exit',
    category: 'Location & Destination',
    title: 'Cabo San Lucas Mexico Timeshare Rescission Desk',
  },
  {
    slug: 'cancun-timeshare-exit',
    url: 'https://timeshare.click/cancun-timeshare-exit',
    displayUrl: 'timeshare.click/cancun-timeshare-exit',
    category: 'Location & Destination',
    title: 'Cancun & Riviera Maya Mexico Timeshare Termination',
  },
  {
    slug: 'puerto-vallarta-exit',
    url: 'https://timeshare.click/puerto-vallarta-exit',
    displayUrl: 'timeshare.click/puerto-vallarta-exit',
    category: 'Location & Destination',
    title: 'Puerto Vallarta & Nuevo Nayarit Timeshare Exit',
  },
  {
    slug: 'cozumel-timeshare-exit',
    url: 'https://timeshare.click/cozumel-timeshare-exit',
    displayUrl: 'timeshare.click/cozumel-timeshare-exit',
    category: 'Location & Destination',
    title: 'Cozumel Caribbean Island Timeshare Relinquishment',
  },
  {
    slug: 'san-antonio-timeshare-exit',
    url: 'https://timeshare.click/san-antonio-timeshare-exit',
    displayUrl: 'timeshare.click/san-antonio-timeshare-exit',
    category: 'Location & Destination',
    title: 'San Antonio Texas Hill Country Timeshare Relief',
    stateMatch: ['TX'],
  },
  {
    slug: 'palm-springs-timeshare-exit',
    url: 'https://timeshare.click/palm-springs-timeshare-exit',
    displayUrl: 'timeshare.click/palm-springs-timeshare-exit',
    category: 'Location & Destination',
    title: 'Palm Springs & Coachella Valley Timeshare Relinquishment',
    stateMatch: ['CA'],
  },
  {
    slug: 'kauai-timeshare-exit',
    url: 'https://timeshare.click/kauai-timeshare-exit',
    displayUrl: 'timeshare.click/kauai-timeshare-exit',
    category: 'Location & Destination',
    title: 'Kauai Garden Isle Hawaii Timeshare Contract Exit',
    stateMatch: ['HI'],
  },
  {
    slug: 'steamboat-springs-exit',
    url: 'https://timeshare.click/steamboat-springs-exit',
    displayUrl: 'timeshare.click/steamboat-springs-exit',
    category: 'Location & Destination',
    title: 'Steamboat Springs Colorado Timeshare Relinquishment',
    stateMatch: ['CO'],
  },
  {
    slug: 'scottsdale-timeshare-exit',
    url: 'https://timeshare.click/scottsdale-timeshare-exit',
    displayUrl: 'timeshare.click/scottsdale-timeshare-exit',
    category: 'Location & Destination',
    title: 'Scottsdale & Phoenix Valley Timeshare Exit Intake',
    stateMatch: ['AZ'],
  },

  // 4. State Law Funnels
  {
    slug: 'california-timeshare-exit',
    url: 'https://timeshare.click/california-timeshare-exit',
    displayUrl: 'timeshare.click/california-timeshare-exit',
    category: 'State Law',
    title: 'California Timeshare Owner Protection Act Relief',
    stateMatch: ['CA'],
  },
  {
    slug: 'florida-timeshare-exit',
    url: 'https://timeshare.click/florida-timeshare-exit',
    displayUrl: 'timeshare.click/florida-timeshare-exit',
    category: 'State Law',
    title: 'Florida Statute Chapter 721 Timeshare Relinquishment',
    stateMatch: ['FL'],
  },
  {
    slug: 'tennessee-timeshare-exit',
    url: 'https://timeshare.click/tennessee-timeshare-exit',
    displayUrl: 'timeshare.click/tennessee-timeshare-exit',
    category: 'State Law',
    title: 'Tennessee Time-Share Act Contract Rescission',
    stateMatch: ['TN'],
  },
  {
    slug: 'south-carolina-timeshare-exit',
    url: 'https://timeshare.click/south-carolina-timeshare-exit',
    displayUrl: 'timeshare.click/south-carolina-timeshare-exit',
    category: 'State Law',
    title: 'South Carolina Vacation Time Sharing Plan Relief',
    stateMatch: ['SC'],
  },
  {
    slug: 'missouri-timeshare-exit',
    url: 'https://timeshare.click/missouri-timeshare-exit',
    displayUrl: 'timeshare.click/missouri-timeshare-exit',
    category: 'State Law',
    title: 'Missouri Merchandising Practices Act Timeshare Exit',
    stateMatch: ['MO'],
  },
  {
    slug: 'texas-timeshare-exit',
    url: 'https://timeshare.click/texas-timeshare-exit',
    displayUrl: 'timeshare.click/texas-timeshare-exit',
    category: 'State Law',
    title: 'Texas Property Code Chapter 221 Timeshare Release',
    stateMatch: ['TX'],
  },
  {
    slug: 'arizona-timeshare-exit',
    url: 'https://timeshare.click/arizona-timeshare-exit',
    displayUrl: 'timeshare.click/arizona-timeshare-exit',
    category: 'State Law',
    title: 'Arizona Timeshare Rescission & Deed Relinquishment',
    stateMatch: ['AZ'],
  },
  {
    slug: 'colorado-timeshare-exit',
    url: 'https://timeshare.click/colorado-timeshare-exit',
    displayUrl: 'timeshare.click/colorado-timeshare-exit',
    category: 'State Law',
    title: 'Colorado Consumer Protection Timeshare Relinquishment',
    stateMatch: ['CO'],
  },
  {
    slug: 'north-carolina-timeshare-exit',
    url: 'https://timeshare.click/north-carolina-timeshare-exit',
    displayUrl: 'timeshare.click/north-carolina-timeshare-exit',
    category: 'State Law',
    title: 'North Carolina Time Share Act Contract Relief',
    stateMatch: ['NC'],
  },
  {
    slug: 'georgia-timeshare-exit',
    url: 'https://timeshare.click/georgia-timeshare-exit',
    displayUrl: 'timeshare.click/georgia-timeshare-exit',
    category: 'State Law',
    title: 'Georgia Fair Business Practices Act Timeshare Release',
    stateMatch: ['GA'],
  },
  {
    slug: 'virginia-timeshare-exit',
    url: 'https://timeshare.click/virginia-timeshare-exit',
    displayUrl: 'timeshare.click/virginia-timeshare-exit',
    category: 'State Law',
    title: 'Virginia Real Estate Time-Share Act Termination',
    stateMatch: ['VA'],
  },
  {
    slug: 'utah-timeshare-exit',
    url: 'https://timeshare.click/utah-timeshare-exit',
    displayUrl: 'timeshare.click/utah-timeshare-exit',
    category: 'State Law',
    title: 'Utah Timeshare & Lodging Club Contract Severance',
    stateMatch: ['UT'],
  },
  {
    slug: 'wisconsin-timeshare-exit',
    url: 'https://timeshare.click/wisconsin-timeshare-exit',
    displayUrl: 'timeshare.click/wisconsin-timeshare-exit',
    category: 'State Law',
    title: 'Wisconsin Time-Share Ownership Law Relinquishment',
    stateMatch: ['WI'],
  },
  {
    slug: 'pennsylvania-timeshare-exit',
    url: 'https://timeshare.click/pennsylvania-timeshare-exit',
    displayUrl: 'timeshare.click/pennsylvania-timeshare-exit',
    category: 'State Law',
    title: 'Pennsylvania Real Estate Licensing Timeshare Relief',
    stateMatch: ['PA'],
  },
  {
    slug: 'ohio-timeshare-exit',
    url: 'https://timeshare.click/ohio-timeshare-exit',
    displayUrl: 'timeshare.click/ohio-timeshare-exit',
    category: 'State Law',
    title: 'Ohio Consumer Sales Practices Act Timeshare Release',
    stateMatch: ['OH'],
  },

  // 5. Newly Added Priority Partner Domains & Major Developer Portals
  {
    slug: 'timeshareexitus',
    url: 'https://www.timeshareexitus.com/',
    displayUrl: 'www.timeshareexitus.com',
    category: 'Legal & Situational',
    title: 'Timeshare Exit US - National Relinquishment Authority',
  },
  {
    slug: 'leavetimeshare',
    url: 'https://help.leavetimeshare.com/',
    displayUrl: 'help.leavetimeshare.com',
    category: 'Legal & Situational',
    title: 'Leave Timeshare Helpdesk & Eligibility Verification',
  },
  {
    slug: 'wyndham-exit',
    url: 'https://timeshare.click/wyndham-exit',
    displayUrl: 'timeshare.click/wyndham-exit',
    category: 'Developer & Resort',
    title: 'Wyndham & WorldMark Timeshare Contract Termination',
    resortMatch: ['wyndham', 'worldmark', 'club wyndham'],
  },
  {
    slug: 'westgate-cancellation',
    url: 'https://timeshare.click/westgate-cancellation',
    displayUrl: 'timeshare.click/westgate-cancellation',
    category: 'Developer & Resort',
    title: 'Westgate Resorts High Dues & Mortgage Cancellation',
    resortMatch: ['westgate', 'westgate resorts', 'westgate lakes'],
  },
  {
    slug: 'diamond-resorts-exit',
    url: 'https://timeshare.click/diamond-resorts-exit',
    displayUrl: 'timeshare.click/diamond-resorts-exit',
    category: 'Developer & Resort',
    title: 'Diamond Resorts & HGV Trust Contract Cancellation',
    resortMatch: ['diamond', 'diamond resorts', 'dri'],
  },
  {
    slug: 'marriott-vacation-club-cancellation',
    url: 'https://timeshare.click/marriott-vacation-club-cancellation',
    displayUrl: 'timeshare.click/marriott-vacation-club-cancellation',
    category: 'Developer & Resort',
    title: 'Marriott Vacation Club Contract Release Portal',
    resortMatch: ['marriott', 'marriott vacation club', 'mvoc'],
  },
  {
    slug: 'bluegreen-vacations-exit',
    url: 'https://timeshare.click/bluegreen-vacations-exit',
    displayUrl: 'timeshare.click/bluegreen-vacations-exit',
    category: 'Developer & Resort',
    title: 'Bluegreen Vacations Traveler Plus Contract Relief',
    resortMatch: ['bluegreen', 'bluegreen vacations'],
  },
  {
    slug: 'holiday-inn-club-exit',
    url: 'https://timeshare.click/holiday-inn-club-exit',
    displayUrl: 'timeshare.click/holiday-inn-club-exit',
    category: 'Developer & Resort',
    title: 'Holiday Inn Club & Orange Lake Contract Release',
    resortMatch: ['holiday inn', 'holiday inn club', 'orange lake'],
  },
  {
    slug: 'disney-vacation-club-exit',
    url: 'https://timeshare.click/disney-vacation-club-exit',
    displayUrl: 'timeshare.click/disney-vacation-club-exit',
    category: 'Developer & Resort',
    title: 'Disney Vacation Club (DVC) Deed Relinquishment',
    resortMatch: ['disney', 'dvc', 'disney vacation club'],
  },
  {
    slug: 'vistana-sheraton-exit',
    url: 'https://timeshare.click/vistana-sheraton-exit',
    displayUrl: 'timeshare.click/vistana-sheraton-exit',
    category: 'Developer & Resort',
    title: 'Vistana Signature Experiences & Sheraton Exit',
    resortMatch: ['vistana', 'sheraton vistana', 'vistana signature'],
  },
  {
    slug: 'welk-resorts-exit',
    url: 'https://timeshare.click/welk-resorts-exit',
    displayUrl: 'timeshare.click/welk-resorts-exit',
    category: 'Developer & Resort',
    title: 'Welk Resorts & Experiences Timeshare Cancellation',
    resortMatch: ['welk', 'welk resorts', 'hyatt welk'],
  },
  {
    slug: 'capital-vacations-exit',
    url: 'https://timeshare.click/capital-vacations-exit',
    displayUrl: 'timeshare.click/capital-vacations-exit',
    category: 'Developer & Resort',
    title: 'Capital Vacations Club & Trust Deed Elimination',
    resortMatch: ['capital', 'capital vacations'],
  },
  {
    slug: 'timeshare-mortgage-relief',
    url: 'https://timeshare.click/timeshare-mortgage-relief',
    displayUrl: 'timeshare.click/timeshare-mortgage-relief',
    category: 'Legal & Situational',
    title: 'Timeshare Mortgage Debt Relief & Note Rescission',
  },
  {
    slug: 'inherited-timeshare-cancellation',
    url: 'https://timeshare.click/inherited-timeshare-cancellation',
    displayUrl: 'timeshare.click/inherited-timeshare-cancellation',
    category: 'Legal & Situational',
    title: 'Inherited Timeshare Disclaimer & Probate Refusal',
  },
  {
    slug: 'maintenance-fee-relief',
    url: 'https://timeshare.click/maintenance-fee-relief',
    displayUrl: 'timeshare.click/maintenance-fee-relief',
    category: 'Legal & Situational',
    title: 'Immediate Maintenance Fee Freeze & Relief Intake',
  },
  {
    slug: 'elderly-timeshare-protection',
    url: 'https://timeshare.click/elderly-timeshare-protection',
    displayUrl: 'timeshare.click/elderly-timeshare-protection',
    category: 'Legal & Situational',
    title: 'Elderly & Vulnerable Adult Timeshare Consumer Protection',
  },
  {
    slug: 'foreclosure-credit-defense',
    url: 'https://timeshare.click/foreclosure-credit-defense',
    displayUrl: 'timeshare.click/foreclosure-credit-defense',
    category: 'Legal & Situational',
    title: 'Timeshare Foreclosure & Credit Score Defense Bureau',
  },
  {
    slug: 'special-assessment-cancellation',
    url: 'https://timeshare.click/special-assessment-cancellation',
    displayUrl: 'timeshare.click/special-assessment-cancellation',
    category: 'Legal & Situational',
    title: 'Renovation & Hurricane Special Assessment Cancellation',
  },
  {
    slug: 'timeshare-deed-back',
    url: 'https://timeshare.click/timeshare-deed-back',
    displayUrl: 'timeshare.click/timeshare-deed-back',
    category: 'Legal & Situational',
    title: 'Official Timeshare Deed-Back & Surrender Verification',
  },
  {
    slug: 'florida-timeshare-law',
    url: 'https://timeshare.click/florida-timeshare-law',
    displayUrl: 'timeshare.click/florida-timeshare-law',
    category: 'State Law',
    title: 'Florida Timeshare Rescission & Ch. 721 Legal Authority',
    stateMatch: ['FL'],
  },
  {
    slug: 'nevada-timeshare-exit',
    url: 'https://timeshare.click/nevada-timeshare-exit',
    displayUrl: 'timeshare.click/nevada-timeshare-exit',
    category: 'State Law',
    title: 'Nevada NRS Chapter 119A Timeshare Termination',
    stateMatch: ['NV'],
  },
];

// Helper to convert UserLandingPage to LandingPageSite interface
export const LANDING_PAGE_DOMAINS: LandingPageSite[] = USER_LANDING_PAGES.map((lp) => ({
  domain: lp.displayUrl,
  title: lp.title,
  niche: lp.category,
  preferredResorts: lp.resortMatch || ['All Developers in Region'],
  activeCampaigns: 4,
  monthlyTraffic: '28,400 visits',
}));

// Smart matcher to find the best timeshare.click URL based on resort, state, or reason
export function getDomainForResort(resortName: string, state = '', dispute = ''): string {
  const normResort = (resortName || '').toLowerCase();
  const normState = (state || '').toUpperCase();
  const normDispute = (dispute || '').toLowerCase();

  // 1. Check situational grievances
  if (normDispute.includes('veteran') || normDispute.includes('military')) {
    return 'timeshare.click/veteran-timeshare-relief';
  }
  if (normDispute.includes('widow') || normDispute.includes('surviving') || normDispute.includes('passed away')) {
    return 'timeshare.click/widow-timeshare-release';
  }
  if (normDispute.includes('divorce') || normDispute.includes('separation')) {
    return 'timeshare.click/divorce-timeshare-removal';
  }
  if (normDispute.includes('perpetual') || normDispute.includes('forever') || normDispute.includes('heir')) {
    return 'timeshare.click/perpetual-contract-relief';
  }
  if (normDispute.includes('mortgage') || normDispute.includes('loan') || normDispute.includes('note balance')) {
    return 'timeshare.click/timeshare-mortgage-relief';
  }
  if (normDispute.includes('inherit') || normDispute.includes('probate') || normDispute.includes('passed down')) {
    return 'timeshare.click/inherited-timeshare-cancellation';
  }
  if (normDispute.includes('elderly') || normDispute.includes('senior') || normDispute.includes('fixed income')) {
    return 'timeshare.click/elderly-timeshare-protection';
  }
  if (normDispute.includes('foreclosure') || normDispute.includes('credit score') || normDispute.includes('credit defense')) {
    return 'timeshare.click/foreclosure-credit-defense';
  }
  if (normDispute.includes('special assessment') || normDispute.includes('roof assessment') || normDispute.includes('renovation')) {
    return 'timeshare.click/special-assessment-cancellation';
  }
  if (normDispute.includes('deed back') || normDispute.includes('surrender') || normDispute.includes('give back')) {
    return 'timeshare.click/timeshare-deed-back';
  }
  if (normDispute.includes('collection') || normDispute.includes('harass') || normDispute.includes('past due')) {
    return 'timeshare.click/stop-timeshare-collections';
  }
  if (normDispute.includes('maintenance fee') || normDispute.includes('dues relief')) {
    return 'timeshare.click/maintenance-fee-relief';
  }
  if (normDispute.includes('hike') || normDispute.includes('assessment') || normDispute.includes('escalat')) {
    return 'timeshare.click/annual-fee-hike-cancellation';
  }

  // 2. Check exact resort developer matches
  const matchDeveloper = USER_LANDING_PAGES.find(
    (lp) => lp.resortMatch && lp.resortMatch.some((rm) => normResort.includes(rm))
  );
  if (matchDeveloper) return matchDeveloper.displayUrl;

  // 3. Check destination / state matches
  if (normResort.includes('orlando') || normResort.includes('kissimmee')) {
    return 'timeshare.click/orlando-timeshare-exit';
  }
  if (normResort.includes('las vegas') || normResort.includes('vegas')) {
    return 'timeshare.click/las-vegas-timeshare-exit';
  }
  if (normResort.includes('myrtle beach')) {
    return 'timeshare.click/myrtle-beach-timeshare-exit';
  }
  if (normResort.includes('gatlinburg') || normResort.includes('pigeon forge') || normResort.includes('smoky')) {
    return 'timeshare.click/gatlinburg-timeshare-exit';
  }
  if (normResort.includes('branson') || normResort.includes('ozark')) {
    return 'timeshare.click/branson-timeshare-exit';
  }
  if (normResort.includes('maui') || normResort.includes('hawaii') || normResort.includes('honolulu')) {
    return 'timeshare.click/maui-timeshare-exit';
  }
  if (normResort.includes('cabo') || normResort.includes('cancun') || normResort.includes('mexico')) {
    return 'timeshare.click/cancun-timeshare-exit';
  }

  // 4. Check state match
  if (normState) {
    const matchState = USER_LANDING_PAGES.find(
      (lp) => lp.stateMatch && lp.stateMatch.includes(normState)
    );
    if (matchState) return matchState.displayUrl;
  }

  // Default fallback from user's primary landing pages
  const coreLandingPages = [
    'timeshare.click/perpetual-contract-relief',
    'timeshare.click/annual-fee-hike-cancellation',
    'timeshare.click/urgent-timeshare-escape',
    'timeshare.click/guaranteed-escrow-timeshare-exit',
    'timeshare.click/unconscionable-contract-relief',
    'timeshare.click/false-oral-promise-rescission',
  ];
  return coreLandingPages[Math.floor(Math.random() * coreLandingPages.length)];
}

import { INITIAL_SEED_LEADS, INITIAL_SEED_QUEUE } from './initialLeads';

export const INITIAL_LIVE_LEADS: Lead[] = INITIAL_SEED_LEADS;
export const SAMPLE_QUEUE_LEADS: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[] = INITIAL_SEED_QUEUE;

