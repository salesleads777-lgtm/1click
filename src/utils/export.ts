import * as XLSX from 'xlsx';
import { Lead } from '../types/lead';

export function exportLeadsToExcel(leads: Lead[], filenamePrefix = '1ClickLeads_Live_Timeshare_Exit_Export') {
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${filenamePrefix}_${dateStr}.xlsx`;

  // Format data specifically tagged with Landing Page Source Domains
  const formattedData = leads.map(lead => ({
    'Lead ID': lead.id,
    'Received At': new Date(lead.timestamp).toLocaleString(),
    'LANDING PAGE SOURCE DOMAIN': lead.sourceDomain, // High-visibility tagged column
    'LANDING PAGE FULL URL': lead.landingPageUrl,
    'MARKETING CAMPAIGN': lead.campaignSource,
    'Client Full Name': lead.fullName,
    'Phone': lead.phone,
    'Email': lead.email,
    'City': lead.city,
    'State': lead.state,
    'Zip Code': lead.zipCode,
    'Timeshare Developer': lead.resortDeveloper,
    'Resort Property': lead.resortName || 'N/A',
    'Annual Maintenance Fee ($)': lead.annualMaintenanceFee,
    'Mortgage Balance ($)': lead.mortgageBalance,
    'Years Owned': lead.yearsOwned,
    'Ownership Type': lead.timeshareType,
    'Exit Urgency': lead.urgency,
    'Intent Score (%)': `${lead.intentScore}%`,
    'Lead Status': lead.status,
    'Claimed By':
      typeof lead.claimedBy === 'object' && lead.claimedBy !== null
        ? ((lead.claimedBy as any).username || (lead.claimedBy as any).name || 'Unclaimed')
        : (lead.claimedBy || 'Unclaimed'),
    'Claimed At': lead.claimedAt ? new Date(lead.claimedAt).toLocaleString() : 'N/A',
    'Dispute Reason': lead.disputeReason,
    'IP Address': lead.ipAddress,
    'Closer Notes': lead.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths for clean executive presentation
  worksheet['!cols'] = [
    { wch: 14 }, // Lead ID
    { wch: 20 }, // Received At
    { wch: 38 }, // LANDING PAGE SOURCE DOMAIN
    { wch: 55 }, // LANDING PAGE FULL URL
    { wch: 35 }, // MARKETING CAMPAIGN
    { wch: 24 }, // Client Full Name
    { wch: 18 }, // Phone
    { wch: 28 }, // Email
    { wch: 16 }, // City
    { wch: 8 },  // State
    { wch: 10 }, // Zip Code
    { wch: 22 }, // Timeshare Developer
    { wch: 30 }, // Resort Property
    { wch: 25 }, // Annual Maintenance Fee
    { wch: 22 }, // Mortgage Balance
    { wch: 12 }, // Years Owned
    { wch: 18 }, // Ownership Type
    { wch: 14 }, // Exit Urgency
    { wch: 16 }, // Intent Score
    { wch: 14 }, // Lead Status
    { wch: 45 }, // Dispute Reason
    { wch: 22 }, // IP Address
    { wch: 40 }, // Closer Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Live Timeshare Leads');

  // Trigger download
  XLSX.writeFile(workbook, fileName);
}

export function exportLeadsToCSV(leads: Lead[], filenamePrefix = '1ClickLeads_Tagged_Export') {
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'Lead ID',
    'Received At',
    'LANDING PAGE SOURCE DOMAIN',
    'LANDING PAGE FULL URL',
    'MARKETING CAMPAIGN',
    'Full Name',
    'Phone',
    'Email',
    'City',
    'State',
    'Zip Code',
    'Timeshare Developer',
    'Resort Property',
    'Annual Maintenance Fee',
    'Mortgage Balance',
    'Years Owned',
    'Ownership Type',
    'Intent Score',
    'Exit Urgency',
    'Status',
    'Claimed By',
    'Claimed At',
    'Dispute Reason',
    'IP Address',
    'Notes',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = leads.map(l => [
    escapeCSV(l.id),
    escapeCSV(new Date(l.timestamp).toLocaleString()),
    escapeCSV(l.sourceDomain),
    escapeCSV(l.landingPageUrl),
    escapeCSV(l.campaignSource),
    escapeCSV(l.fullName),
    escapeCSV(l.phone),
    escapeCSV(l.email),
    escapeCSV(l.city),
    escapeCSV(l.state),
    escapeCSV(l.zipCode),
    escapeCSV(l.resortDeveloper),
    escapeCSV(l.resortName || ''),
    escapeCSV(l.annualMaintenanceFee),
    escapeCSV(l.mortgageBalance),
    escapeCSV(l.yearsOwned),
    escapeCSV(l.timeshareType),
    escapeCSV(`${l.intentScore}%`),
    escapeCSV(l.urgency),
    escapeCSV(l.status),
    escapeCSV(
      typeof l.claimedBy === 'object' && l.claimedBy !== null
        ? ((l.claimedBy as any).username || (l.claimedBy as any).name || 'Unclaimed')
        : (l.claimedBy || 'Unclaimed')
    ),
    escapeCSV(l.claimedAt ? new Date(l.claimedAt).toLocaleString() : 'N/A'),
    escapeCSV(l.disputeReason),
    escapeCSV(l.ipAddress),
    escapeCSV(l.notes || ''),
  ].join(','));

  const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
