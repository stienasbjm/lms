import Swal from 'sweetalert2';

// Custom themed SweetAlert2 instance for LMS STIE Nasional Banjarmasin
export const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-3xl border border-slate-200 shadow-2xl p-6 font-sans bg-white',
    title: 'text-lg font-bold text-slate-900 tracking-tight mb-2',
    htmlContainer: 'text-xs text-slate-600 leading-relaxed',
    confirmButton: 'px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-bold text-xs rounded-xl shadow-md transition-all mx-1.5 cursor-pointer',
    cancelButton: 'px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all mx-1.5 cursor-pointer border border-slate-200',
    denyButton: 'px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mx-1.5 cursor-pointer',
  },
  buttonsStyling: false,
});

// Toast notification (top-end)
export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl border border-slate-200 shadow-xl bg-white/95 backdrop-blur-md px-4 py-3 text-xs font-semibold font-sans',
    title: 'text-xs font-bold text-slate-800'
  },
  didOpen: (t) => {
    t.onmouseenter = Swal.stopTimer;
    t.onmouseleave = Swal.resumeTimer;
  }
});

export const showSuccessToast = (message) => {
  return toast.fire({
    icon: 'success',
    title: message
  });
};

export const showErrorToast = (message) => {
  return toast.fire({
    icon: 'error',
    title: message
  });
};

export const showInfoToast = (message) => {
  return toast.fire({
    icon: 'info',
    title: message
  });
};

export const showConfirmDialog = async ({
  title = 'Konfirmasi Tindakan',
  text = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmButtonText = 'Ya, Lanjutkan',
  cancelButtonText = 'Batal',
  icon = 'warning'
}) => {
  const result = await customSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });
  return result.isConfirmed;
};

export const showSuccessAlert = (title, text = '') => {
  return customSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK'
  });
};

export const showErrorAlert = (title, text = '') => {
  return customSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Tutup'
  });
};

export { Swal };
export default Swal;
