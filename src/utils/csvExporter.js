/**
 * CSV Exporter Utility (Client-Side Export)
 * Mengonversi data JSON/Array ke berkas CSV dan langsung mengunduh di browser pengguna.
 */

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert("Tidak ada data untuk diekspor!");
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCSV(h.label)).join(',');
  const rowLines = rows.map(row => {
    return headers.map(h => escapeCSV(row[h.key])).join(',');
  });

  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
