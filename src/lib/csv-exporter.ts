import { FieldActivity, TelemetryObservation, FarmAlert, ExportFilter, IoTSensor } from '../types';
import { ActivityLogger } from './activity-logger';

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvString(headers: string[], rows: unknown[][]): string {
  const headerRow = headers.map(escapeCsv).join(',');
  const dataRows = rows.map((row) => row.map(escapeCsv).join(','));
  return [headerRow, ...dataRows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildExcelXmlString(title: string, headers: string[], rows: unknown[][]): string {
  const tableHeaders = headers
    .map(
      (h) =>
        `<th style="background-color:#16a34a;color:#ffffff;font-weight:bold;padding:8px;border:1px solid #cbd5e1;">${h}</th>`
    )
    .join('');
  const tableRows = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (cell) =>
              `<td style="padding:6px;border:1px solid #e2e8f0;">${
                cell !== null && cell !== undefined ? String(cell) : ''
              }</td>`
          )
          .join('')}</tr>`
    )
    .join('');
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${title}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
    </head>
    <body>
      <h2>AgriTwin — ${title}</h2>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body>
    </html>
  `;
}

function applyDateFilter<T extends { timestamp?: string; createdAt?: string; measurementTimestamp?: string }>(
  items: T[],
  filter: ExportFilter
): T[] {
  return items.filter((item) => {
    const ts = item.timestamp || item.createdAt || item.measurementTimestamp || '';
    if (!ts) return true;
    const d = new Date(ts).getTime();
    if (filter.dateFrom && d < new Date(filter.dateFrom).getTime()) return false;
    if (filter.dateTo && d > new Date(filter.dateTo + 'T23:59:59').getTime()) return false;
    return true;
  });
}

export function exportActivityLog(
  activities: FieldActivity[],
  filter: ExportFilter = {},
  exportedBy?: string
): void {
  let filtered = applyDateFilter(activities, filter);

  if (filter.farmId && filter.farmId !== 'all') {
    filtered = filtered.filter((a) => a.farmId === filter.farmId);
  }
  if (filter.plotId && filter.plotId !== 'all') {
    filtered = filtered.filter((a) => a.plotId === filter.plotId);
  }
  if (filter.severity && filter.severity !== 'all') {
    filtered = filtered.filter((a) => a.severity === filter.severity);
  }
  if (filter.eventType && filter.eventType !== 'all') {
    filtered = filtered.filter((a) => a.eventType === filter.eventType);
  }

  const headers = ['Timestamp', 'Event Type', 'Title', 'Description', 'Severity', 'Farm ID', 'Plot ID', 'Sensor ID', 'Created By'];
  const rows = filtered.map((a) => [
    new Date(a.timestamp).toLocaleString(),
    a.eventType,
    a.title,
    a.description,
    a.severity,
    a.farmId || '',
    a.plotId || '',
    a.sensorId || '',
    a.createdBy || '',
  ]);

  const date = new Date().toISOString().split('T')[0];
  if (filter.format === 'excel') {
    const excelXml = buildExcelXmlString('Activity Log', headers, rows);
    downloadFile(excelXml, `agritwin_activity_log_${date}.xls`, 'application/vnd.ms-excel');
  } else {
    const csv = buildCsvString(headers, rows);
    downloadFile(csv, `agritwin_activity_log_${date}.csv`);
  }

  ActivityLogger.csvExported('Activity Log', filtered.length, exportedBy);
}

export function exportTelemetry(
  observations: TelemetryObservation[],
  filter: ExportFilter = {},
  exportedBy?: string
): void {
  let filtered = applyDateFilter(
    observations.map((o) => ({ ...o, timestamp: o.measurementTimestamp })),
    filter
  ) as (TelemetryObservation & { timestamp: string })[];

  if (filter.farmId && filter.farmId !== 'all') {
    filtered = filtered.filter((o) => o.farmId === filter.farmId);
  }
  if (filter.plotId && filter.plotId !== 'all') {
    filtered = filtered.filter((o) => o.plotId === filter.plotId);
  }
  if (filter.sensorId && filter.sensorId !== 'all') {
    filtered = filtered.filter((o) => o.sensorId === filter.sensorId);
  }

  const headers = ['Timestamp', 'Farm ID', 'Plot ID', 'Sensor ID', 'Parameter', 'Value', 'Unit', 'Quality', 'Data Source', 'Notes'];
  const rows = filtered.map((o) => [
    new Date(o.measurementTimestamp).toLocaleString(),
    o.farmId,
    o.plotId,
    o.sensorId,
    o.displayName || o.parameterKey,
    o.value,
    o.unit,
    o.qualityStatus,
    o.dataSource,
    o.notes || '',
  ]);

  const date = new Date().toISOString().split('T')[0];
  if (filter.format === 'excel') {
    const excelXml = buildExcelXmlString('Field Telemetry Data', headers, rows);
    downloadFile(excelXml, `agritwin_field_sensor_data_${date}.xls`, 'application/vnd.ms-excel');
  } else {
    const csv = buildCsvString(headers, rows);
    downloadFile(csv, `agritwin_field_sensor_data_${date}.csv`);
  }

  ActivityLogger.csvExported('Field Sensor Data', filtered.length, exportedBy);
}

export function exportSensorHistory(
  observations: TelemetryObservation[],
  sensorId: string,
  filter: ExportFilter = {},
  exportedBy?: string
): void {
  const sensorObs = observations.filter((o) => o.sensorId === sensorId);
  exportTelemetry(sensorObs, filter, exportedBy);
}

export function exportAlerts(
  alerts: FarmAlert[],
  filter: ExportFilter = {},
  exportedBy?: string
): void {
  let filtered = applyDateFilter(
    alerts.map((a) => ({ ...a, timestamp: a.createdAt })),
    filter
  ) as (FarmAlert & { timestamp: string })[];

  if (filter.farmId && filter.farmId !== 'all') {
    filtered = filtered.filter((a) => a.farmId === filter.farmId);
  }
  if (filter.severity && filter.severity !== 'all') {
    filtered = filtered.filter((a) => a.severity === filter.severity);
  }

  const headers = ['Created At', 'Alert Type', 'Title', 'Message', 'Severity', 'Status', 'Farm ID', 'Plot ID', 'Sensor ID', 'Value', 'Threshold', 'Resolved At', 'Resolved By'];
  const rows = filtered.map((a) => [
    new Date(a.createdAt).toLocaleString(),
    a.alertType,
    a.title,
    a.message,
    a.severity,
    a.status,
    a.farmId || '',
    a.plotId || '',
    a.sensorId || '',
    a.value ?? '',
    a.threshold ?? '',
    a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '',
    a.resolvedBy || '',
  ]);

  const date = new Date().toISOString().split('T')[0];
  if (filter.format === 'excel') {
    const excelXml = buildExcelXmlString('Farm Alerts', headers, rows);
    downloadFile(excelXml, `agritwin_alerts_${date}.xls`, 'application/vnd.ms-excel');
  } else {
    const csv = buildCsvString(headers, rows);
    downloadFile(csv, `agritwin_alerts_${date}.csv`);
  }

  ActivityLogger.csvExported('Alerts', filtered.length, exportedBy);
}

export function exportSensorList(
  sensors: IoTSensor[],
  exportedBy?: string
): void {
  const headers = ['Sensor ID', 'Node Name', 'Type', 'Plot Code', 'Status', 'Battery %', 'Current Reading', 'Last Ping', 'Farm ID', 'Plot ID'];
  const rows = sensors.map((s) => [
    s.id,
    s.nodeName,
    s.type || '',
    s.assignedPlotCode,
    s.status,
    s.batteryPct,
    s.currentReading || '',
    s.lastPing ? new Date(s.lastPing).toLocaleString() : '',
    s.farmId || '',
    s.plotId || '',
  ]);

  const csv = buildCsvString(headers, rows);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `agritwin_sensor_units_${date}.csv`);

  ActivityLogger.csvExported('Sensor Units', sensors.length, exportedBy);
}
