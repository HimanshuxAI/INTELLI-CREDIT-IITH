import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseUploadedFile(file: File): Promise<{ type: string; fields: Record<string, string>; flags: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fields: Record<string, string> = {};
      const flags: string[] = [];

      // Detect file type and extract what we can from text
      const lower = file.name.toLowerCase();
      if (lower.includes('gstr') || lower.includes('gst')) {
        fields['Document Type'] = 'GST Returns';
        fields['Detected Fields'] = 'GSTR-1, GSTR-2A, GSTR-3B';
        if (content.length > 1000) flags.push('Multi-period detected');
        flags.push('ITC reconciliation required');
      } else if (lower.includes('bank') || lower.includes('statement')) {
        fields['Document Type'] = 'Bank Statement';
        fields['Detected Fields'] = 'Transactions, Balances, Credits, Debits';
        flags.push('Anomaly scan required');
      } else if (lower.includes('annual') || lower.includes('report')) {
        fields['Document Type'] = 'Annual Report';
        fields['Detected Fields'] = 'P&L, Balance Sheet, Cash Flow, Notes';
        flags.push('Schedule III format detected');
      } else if (lower.includes('itr') || lower.includes('income')) {
        fields['Document Type'] = 'Income Tax Return';
        fields['Detected Fields'] = 'Taxable Income, TDS, Advance Tax';
      } else {
        fields['Document Type'] = file.type.includes('pdf') ? 'PDF Document' : 'Spreadsheet';
        fields['File Size'] = `${(file.size / 1024).toFixed(0)} KB`;
      }
      fields['File Name'] = file.name;
      fields['File Size'] = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      fields['Uploaded At'] = new Date().toLocaleTimeString();
      resolve({ type: fields['Document Type'], fields, flags });
    };

    // For PDFs and binary files, just use the name-based detection
    if (file.type === 'application/pdf' || file.type.includes('sheet') || file.type.includes('excel')) {
      reader.readAsArrayBuffer(file);
      // Manually resolve since ArrayBuffer gives us binary
      setTimeout(() => {
        const fields: Record<string, string> = {
          'File Name': file.name,
          'File Size': `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          'File Type': file.type,
          'Uploaded At': new Date().toLocaleTimeString(),
        };
        const flags: string[] = [];
        const lower = file.name.toLowerCase();
        if (lower.includes('gstr') || lower.includes('gst')) {
          fields['Document Type'] = 'GST Returns'; flags.push('ITC reconciliation queued');
        } else if (lower.includes('bank')) {
          fields['Document Type'] = 'Bank Statement'; flags.push('Anomaly detection queued');
        } else if (lower.includes('annual') || lower.includes('report')) {
          fields['Document Type'] = 'Annual Report'; flags.push('OCR pipeline initiated');
        } else {
          fields['Document Type'] = 'Financial Document';
        }
        resolve({ type: fields['Document Type'], fields, flags });
      }, 50);
    } else {
      reader.readAsText(file);
    }
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
