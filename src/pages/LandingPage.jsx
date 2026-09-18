import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Award, 
  Video, 
  Sparkles, 
  Lock, 
  ExternalLink,
  ChevronRight,
  Database,
  Building2,
  FileCheck,
  Share2,
  CalendarCheck,
  CheckCircle2,
  Layers,
  HelpCircle,
  Laptop,
  Check,
  Target,
  BarChart3,
  TrendingUp, 
  FileText, 
  Compass,
  Menu,
  X
} from 'lucide-react';
import FirebaseSettingsModal from '../components/common/FirebaseSettingsModal';

export default function LandingPage({ onGoToLogin }) {
  const { loginAsRole } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleQuickLogin = (role) => {
    loginAsRole(role);
  };

  const demoAccounts = [
    {
      role: 'ADMIN',
      badge: 'Super Admin',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      title: 'Administrator Sistem',
      email: 'admin@stienas.ac.id',
      password: 'admin126',
      description: 'Akses penuh tata kelola master akademik OBE, integrasi cloud database Firebase, impor data massal JSON, dan audit log.',
      features: ['Master Kurikulum OBE & CPL/CPMK', 'Konfigurasi Cloud Firebase BaaS', 'Audit Trail & Manajemen Pengguna']
    },
    {
      role: 'AKADEMIK',
      badge: 'Admin BAA',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      title: 'Bagian Akademik (BAA)',
      email: 'akademik@stienas.ac.id',
      password: 'akademik123',
      description: 'Otoritas pembukaan & penutupan semester OBE, penyusunan kelas perkuliahan paralel 16 sesi, dan penugasan dosen pengampu.',
      features: ['Buka & Tutup Semester Manual BAA', 'Buat Kelas Kuliah 16 Sesi RPS', 'Distribusi Dosen & Kuota Mahasiswa']
    },
    {
      role: 'DOSEN',
      badge: 'Dosen Pengampu',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      title: 'Dosen Pengampu OBE',
      email: 'dosen@stienas.ac.id',
      password: 'dosen123',
      identifierExtra: 'NIDN: 1105087501',
      description: 'Dr. H. Muhammad Ramli, S.E., M.M. Pengelolaan modul 16 Sub-CPMK, tatap muka daring, presensi, dan penilaian asesmen otentik.',
      features: ['16 Sub-CPMK & Rubrik Otentik', 'Sematkan Link Drive Bahan Ajar', 'Evaluasi Ketercapaian CPMK Mahasiswa']
    },
    {
      role: 'MAHASISWA',
      badge: 'Mahasiswa',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Mahasiswa (Ahmad Fadillah)',
      email: 'mahasiswa@stienas.ac.id',
      password: 'mhs123',
      identifierExtra: 'NIM: 221011001',
      description: 'Ahmad Fadillah (S1 Manajemen). Mempelajari modul 16 sesi, menyematkan portofolio tugas, dan memantau KHS berstandar OBE.',
      features: ['Akses 16 Modul Sub-CPMK', 'Sematkan Link Portofolio Tugas', 'KHS Komprehensif & Ketercapaian CPL']
    }
  ];

  const faqs = [
    {
      q: 'Apa itu Kurikulum Berbasis Luaran (Outcome-Based Education / OBE) di LMS STIE Nasional?',
      a: 'Kurikulum OBE adalah pendekatan pendidikan yang berfokus pada apa yang mahasiswa mampu ketahui dan lakukan setelah menyelesaikan perkuliahan. Seluruh rancangan pembelajaran, materi 16 sesi, asesmen tugas, hingga ujian UTS/UAS diselaraskan secara transparan dengan Capaian Pembelajaran Lulusan (CPL) dan Capaian Pembelajaran Mata Kuliah (CPMK) sesuai standar akreditasi LAMEMBA dan BAN-PT.'
    },
    {
      q: 'Bagaimana mahasiswa mengumpulkan lembar jawaban tugas dan portofolio berbasis OBE?',
      a: 'Mahasiswa tidak perlu mengunggah berkas fisik berukuran besar ke server LMS. Cukup unggah lembar analisis studi kasus atau portofolio proyek ke Google Drive / OneDrive pribadi, lalu sematkan tautan (link) publiknya ke sistem. Pendekatan zero storage ini menjamin kecepatan akses, paperless, dan efisiensi cloud tanpa batasan kuota.'
    },
    {
      q: 'Bagaimana ketercapaian CPMK dan KHS Mahasiswa dihitung dalam sistem?',
      a: 'Setiap mata kuliah memiliki target luaran terukur dengan ambang batas minimal pemenuhan 70%. Nilai tugas, kuis, UTS, dan UAS tidak hanya dikonversi menjadi huruf mutu A–E dan IPK semester, melainkan juga memetakan persentase ketercapaian luaran pembelajaran (CPMK) dan profil CPL lulusan yang tercatat di KHS mahasiswa.'
    },
    {
      q: 'Siapa yang berwenang membuka semester baru dan membuat kelas perkuliahan paralel?',
      a: 'Sesuai tata kelola akademik institusi, seluruh pembukaan/penutupan semester serta penjadwalan kelas perkuliahan paralel secara eksklusif dikelola oleh Bagian Administrasi Akademik (BAA). Dosen dan mahasiswa hanya menyesuaikan jadwal yang telah ditetapkan oleh BAA.'
    },
    {
      q: 'Apakah sistem mendukung perkuliahan daring hibrida terintegrasi?',
      a: 'Ya, setiap sesi dari 16 pertemuan RPS telah terintegrasi dengan tautan Google Meet, Zoom Meeting, dan video YouTube edukatif. Dosen dapat menyematkan ruang tatap muka virtual pilihan dengan satu kali klik.'
    },
    {
      q: 'Bagaimana LMS ini mendukung persiapan akreditasi LAMEMBA dan BAN-PT?',
      a: 'LMS STIE Nasional secara otomatis mengumpulkan bukti asesmen otentik, rekapitulasi ketercapaian CPMK per mata kuliah, dan rekam jejak portofolio mahasiswa. Data ini menjadi fondasi siklus Continuous Quality Improvement (CQI) yang siap diekspor dalam format audit akreditasi program studi.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-brand-500 selection:text-white">
      
      {/* 0. ANNOUNCEMENT BAR (OBE & University Accreditation Standard) */}
      <div className="bg-brand-950 text-slate-300 text-[11px] py-2 px-4 border-b border-brand-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] border border-gold-500/30">
              Kurikulum OBE 2026/2027
            </span>
            <span>Outcome-Based Education Terintegrasi • Standar Mutu Akreditasi LAMEMBA & BAN-PT</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Banjarmasin, Kalimantan Selatan</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Portal Resmi Sivitas Akademika STIE Nasional</span>
          </div>
        </div>
      </div>

      {/* 1. TOP NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo & Kampus Branding */}
            <div className="flex items-center space-x-3">
              <img 
                src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
                alt="Logo STIE Nasional Banjarmasin" 
                className="w-10 h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform" 
              />
              <div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight block">
                  LMS STIE NASIONAL
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
                  Kurikulum Berbasis Luaran (OBE) • Banjarmasin
                </span>
              </div>
            </div>

            {/* Nav Menu Berstandar Website LMS Kampus */}
            <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
              <a href="#beranda" className="hover:text-brand-800 transition-colors">Beranda</a>
              <a href="#panduan" className="hover:text-brand-800 transition-colors">Panduan LMS</a>
              <a href="#kurikulum" className="hover:text-brand-800 transition-colors">Kurikulum & RPS</a>
              <a href="#bantuan" className="hover:text-brand-800 transition-colors">Pusat Bantuan</a>
            </div>

            {/* Action CTA & Mobile Hamburger */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onGoToLogin}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-950/10 transition-all transform hover:-translate-y-0.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masuk Portal LMS</span>
                <span className="sm:hidden">Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Hamburger Button on Mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Menu Mobile"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Collapsible Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
            <a 
              href="#beranda" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-800"
            >
              Beranda
            </a>
            <a 
              href="#panduan" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-800"
            >
              Panduan LMS
            </a>
            <a 
              href="#kurikulum" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-800"
            >
              Kurikulum & RPS
            </a>
            <a 
              href="#bantuan" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-brand-800"
            >
              Pusat Bantuan
            </a>
            
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onGoToLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-brand-800 text-white rounded-xl text-xs font-bold shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Portal LMS</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-slate-900 text-white py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        
        {/* Glow decorative gradients with smooth GPU animations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-brand-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute -bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float-reverse"></div>
        <div className="absolute top-12 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-float-gentle"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-800/80 border border-brand-700/60 text-xs font-medium text-brand-200 animate-float-gentle shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse-dot"></span>
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Implementasi Kurikulum OBE (Outcome-Based Education) Standar Nasional</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Sistem Pembelajaran Digital Berbasis Luaran, <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-400 via-amber-300 to-white">
              Terstandar 16 Sesi RPS & Berorientasi Capaian Nyata
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Platform pembelajaran resmi Sekolah Tinggi Ilmu Ekonomi (STIE) Nasional Banjarmasin. Mengintegrasikan perumusan Capaian Pembelajaran Lulusan (CPL), Capaian Pembelajaran Mata Kuliah (CPMK), 16 modul Sub-CPMK otentik, tatap muka hibrida (Google Meet/Zoom), presensi real-time, pengumpulan tugas studi kasus via Sematkan Link Drive, hingga penerbitan KHS OBE yang transparan.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk Portal LMS OBE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Key Stat Badges (Standard Top OBE University) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/10">
              <div className="text-gold-400 font-bold text-xl">CPL & CPMK</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Pemetaan Luaran Standar LAMEMBA</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/10">
              <div className="text-emerald-400 font-bold text-xl">16 Sesi RPS</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Sub-CPMK Sesi, UTS P8 & UAS P16</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/10">
              <div className="text-blue-400 font-bold text-xl">Asesmen Otentik</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Evaluasi Berbasis Studi Kasus Nyata</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:bg-white/10">
              <div className="text-purple-400 font-bold text-xl">Zero Storage</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Sematkan Link Drive Bahan & Tugas</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. PILAR KURIKULUM OBE (OUTCOME-BASED EDUCATION FRAMEWORK) */}
      <section id="kurikulum" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Kerangka Kerja Kurikulum OBE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Pilar Pembelajaran Berorientasi Luaran & Mutu Lulusan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Mewujudkan proses perkuliahan terukur yang memastikan setiap mahasiswa mencapai profil kompetensi unggul di bidang ekonomi dan bisnis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Perumusan CPL & CPMK Terukur</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capaian Pembelajaran Lulusan (CPL) dijabarkan secara sistematis ke dalam Capaian Pembelajaran Mata Kuliah (CPMK). Setiap mahasiswa memahami ekspektasi luaran yang harus dikuasai sejak pertemuan pertama.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">16 Modul Pertemuan Sub-CPMK</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap mata kuliah tersusun rapi dalam 16 sesi terstruktur: Sesi 1–7 penguasaan konsep, Sesi 8 Evaluasi Sumatif Tengah Semester (UTS), Sesi 9–15 analisis kasus lanjutan, dan Sesi 16 Evaluasi Proyek Komprehensif (UAS).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Asesmen Otentik Berbasis Kasus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Penilaian tidak hanya menguji memori hafalan, melainkan menilai keterampilan analitis mahasiswa dalam memecahkan studi kasus riil perusahaan, analisis laporan keuangan, dan perencanaan bisnis.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">KHS Portofolio & Ketercapaian Luaran</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kartu Hasil Studi (KHS) menampilkan persentase ketercapaian CPMK secara transparan dengan ambang batas minimal pemenuhan ≥ 70%, disertai rekapitulasi CPL di tingkat program studi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Siklus Perbaikan Mutu (CQI)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mendukung siklus Continuous Quality Improvement (CQI). Hasil capaian luaran mahasiswa menjadi bahan evaluasi berkala bagi program studi untuk penyempurnaan RPS dan materi ajar di semester berikutnya.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 transform">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Portofolio Paperless via Cloud Drive</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengumpulan berkas portofolio karya mahasiswa menggunakan metode Sematkan Link Drive. Bebas repot, zero storage server waste, dan ramah lingkungan tanpa penggunaan kertas.
            </p>
          </div>

        </div>
      </section>

      {/* 4. ALUR SIKLUS PERKULIAHAN 1 SEMESTER BERBASIS OBE & PANDUAN */}
      <section id="panduan" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Siklus Akademik OBE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              4 Langkah Pelaksanaan Perkuliahan Terstandar OBE
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Dari pembukaan semester oleh BAA hingga pelaporan evaluasi mutu akreditasi program studi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 transform">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-base">
                1
              </div>
              <div className="font-bold text-sm text-slate-900">BAA Buka Semester & Kelas OBE</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bagian Akademik (BAA) membuka semester berjalan secara resmi, menyusun kelas paralel berstandar 16 sesi, menetapkan kuota, dan menugaskan dosen pengampu.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 transform">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-base">
                2
              </div>
              <div className="font-bold text-sm text-slate-900">Dosen Siapkan 16 Sub-CPMK</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dosen menyematkan Tautan Link Drive bahan ajar dan tautan Google Meet / Zoom pada setiap pertemuan lengkap dengan target luaran Sub-CPMK dan rubrik asesmen.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-base">
                3
              </div>
              <div className="font-bold text-sm text-slate-900">Presensi & Sematkan Tugas Portofolio</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mahasiswa mengikuti perkuliahan hibrida, absensi tersinkron otomatis, dan menyematkan link lembar jawaban studi kasus via Cloud Drive tanpa beban penyimpanan server.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative space-y-3 hover:border-brand-400 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 transform">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-base">
                4
              </div>
              <div className="font-bold text-sm text-slate-900">Evaluasi Capaian & Terbit KHS OBE</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dosen menilai asesmen otentik (Tugas, Kuis, UTS, UAS). KHS mahasiswa terbit instan lengkap dengan indikator pemenuhan CPMK dan profil CPL lulusan.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. EKOSISTEM FITUR LENGKAP STANDAR KAMPUS DIGITAL */}
      <section id="ekosistem" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Fitur Standar Kampus Digital
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Ekosistem Pengelolaan Perkuliahan yang Lengkap & Handal
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Mendukung kelancaran proses belajar mengajar hibrida dengan infrastruktur modern dan tata kelola yang aman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Struktur 16 Pertemuan Otomatis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap kelas yang dibuat oleh BAA langsung memiliki 16 modul terstruktur sesuai RPS: Sesi 1–7 materi teori pokok, Sesi 8 evaluasi UTS, Sesi 9–15 materi aplikatif, dan Sesi 16 evaluasi akhir UAS.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Sematkan Link Drive & Hemat Storage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Materi ajar dosen dan tugas mahasiswa dihantarkan melalui tautan publik Google Drive / OneDrive pribadi. Menghemat biaya storage server institusi secara permanen dan bebas kendala ukuran berkas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Tatap Muka Virtual Hibrida</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dukungan perkuliahan interaktif dengan penyematan tautan Google Meet, Zoom Meeting, dan video YouTube edukatif yang terintegrasi rapi pada setiap pertemuan perkuliahan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Presensi Sinkron Real-Time</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Daftar presensi mahasiswa otomatis sinkron dengan daftar mahasiswa yang mengambil mata kuliah. Dosen dapat mencatat kehadiran kilat (Hadir, Sakit, Izin, Alpha) dalam hitungan detik.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">KHS Lengkap Sekali Tampil</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mahasiswa melihat rekapitulasi nilai seluruh mata kuliah yang diambil secara langsung tanpa repot memilih kelas dari dropdown, dilengkapi penghitungan IPK semester dan ekspor CSV.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 hover:border-brand-300 transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Keamanan RBAC & Audit Trail</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pemisahan peran yang ketat antara Super Admin, Bagian Akademik (BAA), Dosen, dan Mahasiswa. Setiap aksi perubahan nilai, presensi, dan semester terekam dalam jejak audit sistem.
            </p>
          </div>

        </div>
      </section>

      {/* 6. PERAN PENGGUNA DALAM EKOSISTEM OBE */}
      <section id="peran" className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Peran Sivitas Akademika
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Tanggung Jawab Pengguna dalam Standar Kurikulum OBE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                Bagian Akademik (BAA)
              </span>
              <h3 className="font-bold text-base text-slate-900">Pengelola Semester OBE</h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Buka & tutup semester aktif manual</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Menjadwalkan kelas paralel 16 sesi</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Menugaskan dosen & kuota kelas</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Mengawal kurikulum & CPL prodi</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Dosen Pengampu
              </span>
              <h3 className="font-bold text-base text-slate-900">Fasilitator Luaran & Nilai</h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Sematkan materi Link Drive 16 sesi</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Mengadakan sesi Meet / Zoom daring</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Presensi kilat mahasiswa per sesi</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> Penilaian asesmen otentik & CPMK</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Mahasiswa
              </span>
              <h3 className="font-bold text-base text-slate-900">Pencapai Kompetensi Lulusan</h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Akses modul perkuliahan 16 Sub-CPMK</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Gabung sesi Google Meet satu kali klik</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Sematkan link tugas studi kasus & proyek</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Pantau KHS semester & portofolio CPL</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                Super Admin
              </span>
              <h3 className="font-bold text-base text-slate-900">Tata Kelola & Infrastruktur</h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Manajemen akun & otentikasi peran</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Integrasi Cloud Firebase Firestore</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Impor data massal berbasis JSON</li>
                <li className="flex items-start gap-1.5"><Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Monitoring audit trail & keaktifan</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 7. PROGRAM STUDI TERAKREDITASI & PROFIL LULUSAN OBE */}
      <section id="prodi" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            STIE Nasional Banjarmasin
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Program Studi Sarjana (S1) Berstandar Kurikulum OBE
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Dirancang menghasilkan profil lulusan yang kompeten, beretika profesional, dan adaptif terhadap tantangan industri bisnis modern.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-brand-50 text-brand-800 border border-brand-200">
                Kode Prodi: 61201
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Jenjang S1 • Kurikulum OBE
              </span>
            </div>
            <h3 className="font-bold text-xl text-slate-900">S1 Manajemen</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Membentuk lulusan dengan profil <strong>Manajer Bisnis Analitis</strong>, <strong>Wirausaha Digital Inovatif</strong>, dan <strong>Analis Keuangan Korporasi</strong>. Kurikulum menekankan kemampuan memecahkan masalah strategis dan pengambilan keputusan berbasis data.
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Fokus Luaran CPL:</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Manajemen Keuangan</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Pemasaran Digital</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Kewirausahaan</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Manajemen SDM Strategis</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-brand-50 text-brand-800 border border-brand-200">
                Kode Prodi: 62201
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Jenjang S1 • Kurikulum OBE
              </span>
            </div>
            <h3 className="font-bold text-xl text-slate-900">S1 Akuntansi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mempersiapkan lulusan dengan profil <strong>Akuntan Profesional Beretika</strong>, <strong>Auditor Finansial & Asurans</strong>, serta <strong>Konsultan Perpajakan & Sistem Informasi</strong> yang taat pada Standar Akuntansi Keuangan (SAK).
            </p>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Fokus Luaran CPL:</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Akuntansi Keuangan SAK</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Auditing & Asurans</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Perpajakan Digital</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Akuntansi Sektor Publik</span>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 9. FAQ SECTION BERSTANDAR KURIKULUM OBE */}
      <section id="bantuan" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Pusat Informasi & Bantuan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Pertanyaan yang Sering Diajukan (FAQ Kurikulum OBE)
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Penjelasan lengkap seputar implementasi Kurikulum Berbasis Luaran di LMS STIE Nasional.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex justify-between items-center text-xs sm:text-sm font-bold text-slate-800 hover:text-brand-800 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-brand-800' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. CALL TO ACTION BANNER */}
      <section className="py-14 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 text-white text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-gold-400 text-xs font-semibold">
            <Laptop className="w-3.5 h-3.5" />
            <span>Akses Fleksibel dari Laptop, Tablet, & Ponsel Pintar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Siap Memulai Perkuliahan Berstandar Kurikulum OBE?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Masuk ke portal LMS STIE Nasional Banjarmasin sekarang dan rasakan kemudahan pembelajaran berbasis luaran nyata yang terukur dan akuntabel.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToLogin}
              className="px-8 py-3.5 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 inline-flex items-center gap-2 transition-transform transform hover:scale-105"
            >
              <Lock className="w-4 h-4" />
              <span>Buka Halaman Login LMS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 11. CAMPUS FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Kampus info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-3">
                <img 
                  src={`${import.meta.env.BASE_URL}logo-stienas.png`} 
                  alt="Logo STIE Nasional Banjarmasin" 
                  className="w-10 h-10 object-contain drop-shadow-sm" 
                />
                <div>
                  <div className="font-extrabold text-white text-base">STIE NASIONAL BANJARMASIN</div>
                  <div className="text-[11px] text-slate-400">Sekolah Tinggi Ilmu Ekonomi Nasional</div>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-md">
                Jl. Mayjen Sutoyo S No. 126, Teluk Dalam, Kec. Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan 70114. Menyelenggarakan pendidikan tinggi manajemen dan akuntansi berbasis Kurikulum OBE yang adaptif dan terakreditasi unggul.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Tautan Cepat LMS</div>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li><a href="#beranda" className="hover:text-white transition-colors">Beranda LMS</a></li>
                <li><a href="#panduan" className="hover:text-white transition-colors">Panduan Perkuliahan 16 Sesi</a></li>
                <li><a href="#kurikulum" className="hover:text-white transition-colors">Kurikulum OBE & CPL</a></li>
                <li><a href="#prodi" className="hover:text-white transition-colors">Program Studi Sarjana</a></li>
                <li><a href="#bantuan" className="hover:text-white transition-colors">Pusat Bantuan (FAQ)</a></li>
                <li><button onClick={onGoToLogin} className="hover:text-white transition-colors text-left font-medium text-brand-300">Portal Masuk Akun LMS</button></li>
              </ul>
            </div>

            {/* Standar Mutu & Tata Kelola OBE */}
            <div className="space-y-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Tata Kelola & Standar Mutu</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Penyelenggaraan perkuliahan digital STIE Nasional Banjarmasin diselaraskan dengan Standar Penjaminan Mutu Internal (SPMI) dan kriteria akreditasi unggul LAMEMBA & BAN-PT. Menjamin ketercapaian luaran CPL dan CPMK yang akuntabel, transparan, dan terukur.
              </p>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
            <div>© 2026 STIE Nasional Banjarmasin. Hak Cipta Dilindungi Undang-Undang.</div>
            <div>Kurikulum Berbasis Luaran (Outcome-Based Education) • Standar LAMEMBA & BAN-PT</div>
          </div>
        </div>
      </footer>

      {showConfigModal && (
        <FirebaseSettingsModal onClose={() => setShowConfigModal(false)} />
      )}

    </div>
  );
}
