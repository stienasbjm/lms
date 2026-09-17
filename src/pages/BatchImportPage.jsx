import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { batchImportData } from '../firebase/firestoreService';
import { FileUp, CheckCircle, AlertCircle, Code, Copy, Sparkles } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '../utils/alert';

export default function BatchImportPage({ onDone }) {
  const { user } = useAuth();
  const [importType, setImportType] = useState('MAHASISWA');
  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const sampleFormats = {
    MAHASISWA: `[
  {
    "nim": "221011004",
    "name": "Bambang Pamungkas",
    "email": "221011004@lms.stienas.ac.id",
    "phone": "081299887766",
    "prodiId": "prodi-s1-manajemen",
    "semester": 5
  },
  {
    "nim": "221011005",
    "name": "Dewi Sartika",
    "email": "221011005@lms.stienas.ac.id",
    "phone": "081233445566",
    "prodiId": "prodi-s1-akuntansi",
    "semester": 5
  }
]`,
    DOSEN: `[
  {
    "nidn": "1123058001",
    "name": "Dr. Irwan Setiawan, S.E., M.Ak.",
    "email": "irwan.akuntansi@lms.stienas.ac.id",
    "phone": "081155001122",
    "prodiId": "prodi-s1-akuntansi"
  }
]`,
    MATA_KULIAH: `[
  {
    "kodeMk": "AKT305",
    "namaMk": "Akuntansi Biaya",
    "sks": 3,
    "semesterDefault": 4,
    "prodiId": "prodi-s1-akuntansi"
  },
  {
    "kodeMk": "MNJ308",
    "namaMk": "Perilaku Organisasi",
    "sks": 3,
    "semesterDefault": 5,
    "prodiId": "prodi-s1-manajemen"
  }
]`
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    setImportSuccess(false);
    if (!text.trim()) {
      setParsedData([]);
      setParseError(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError("Format JSON harus berupa Array / Daftar obyek [ { ... } ].");
        setParsedData([]);
      } else {
        setParseError(null);
        setParsedData(parsed);
      }
    } catch (err) {
      setParseError("Sintaks JSON tidak valid: " + err.message);
      setParsedData([]);
    }
  };

  const handleUseSample = () => {
    handleJsonChange(sampleFormats[importType]);
  };

  const handleExecuteImport = async () => {
    if (!parsedData.length) return;
    setLoading(true);
    try {
      await batchImportData(importType, parsedData, user);
      setImportSuccess(true);
      setJsonText('');
      setParsedData([]);
      showSuccessAlert("Impor Berhasil", `${parsedData.length} data ${importType.toLowerCase()} berhasil disimpan ke dalam basis data LMS!`);
    } catch (err) {
      showErrorAlert("Gagal Impor Data", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-brand-700" />
          Impor Massal JSON Sisi Klien (FR-02.4)
        </h2>
        <p className="text-xs text-slate-500">
          Paste berkas JSON untuk pendaftaran massal Mahasiswa, Dosen, atau Mata Kuliah dengan batch insert.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Tipe Data Impor:</label>
                <div className="flex gap-2">
                  {['MAHASISWA', 'DOSEN', 'MATA_KULIAH'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setImportType(t);
                        setJsonText('');
                        setParsedData([]);
                        setParseError(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                        importType === t 
                          ? 'bg-brand-800 text-white border-brand-800 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseSample}
                className="inline-flex items-center gap-1.5 text-xs text-brand-700 font-bold hover:underline self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gunakan Contoh JSON
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste JSON Array Disini:
              </label>
              <textarea
                rows="10"
                value={jsonText}
                onChange={e => handleJsonChange(e.target.value)}
                placeholder={'[\n  {\n    "nim": "221011004",\n    "name": "Bambang Pamungkas",\n    ...\n  }\n]'}
                className="w-full text-xs font-mono p-3 bg-slate-900 text-emerald-400 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 border border-slate-800"
              />
            </div>

            {parseError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Data berhasil diimpor ke database! Anda dapat memeriksa di menu Master Data.</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-medium">
                {parsedData.length} baris data tervalidasi siap impor.
              </span>
              <button
                type="button"
                disabled={loading || !parsedData.length || !!parseError}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-brand-800 hover:bg-brand-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <FileUp className="w-4 h-4" />
                {loading ? 'Memproses Batch Write...' : `Eksekusi Impor (${parsedData.length} Data)`}
              </button>
            </div>

          </div>
        </div>

        {/* Preview Panel */}
        <div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-brand-700" />
              Preview Data ({parsedData.length})
            </h4>

            {parsedData.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                Data preview akan tampil di sini setelah Anda melakukan paste JSON yang valid.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {parsedData.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
                    <div className="font-bold text-slate-800 mb-0.5">#{idx + 1} {item.name || item.namaMk}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.nim ? `NIM: ${item.nim}` : item.kodeMk ? `Kode: ${item.kodeMk} (${item.sks} SKS)` : item.nidn ? `NIDN: ${item.nidn}` : item.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
