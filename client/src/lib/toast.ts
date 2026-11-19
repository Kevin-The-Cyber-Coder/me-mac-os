import Swal from 'sweetalert2'

const base = {
  background: 'var(--panel-strong)',
  color: 'var(--fg)',
  confirmButtonColor: 'var(--accent)',
  cancelButtonColor: 'rgba(148,163,184,0.25)',
  customClass: {
    popup: 'kcp-swal',
  },
}

export const toast = (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') =>
  Swal.fire({
    ...base,
    toast: true,
    position: 'bottom-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3200,
    timerProgressBar: true,
    background: '#0b1020',
    color: '#e8ecff',
  })

export const alertDialog = (title: string, text?: string, icon: 'success' | 'error' | 'info' | 'warning' = 'info') =>
  Swal.fire({ ...base, title, text, icon, confirmButtonText: 'Got it' })

export const confirmDialog = async (title: string, text: string, confirmText = 'Confirm') => {
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
  })
  return result.isConfirmed
}

export const promptDialog = async (title: string, inputValue = '', placeholder = '') => {
  const result = await Swal.fire({
    ...base,
    title,
    input: 'text',
    inputValue,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Save',
  })
  return result.isConfirmed ? String(result.value || '') : null
}
