import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

// Validação CPF (algoritmo oficial)
export function validateCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}

export function maskCPF(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara de telefone com suporte internacional.
 *
 * Detecção:
 *  - Se input começar com `+` → trata como internacional (E.164), espaça os blocos
 *  - Senão → assume Brasil, mostra (DD) XXXXX-XXXX
 *
 * Limites:
 *  - Brasil: 11 dígitos (DDD + 9 dígitos)
 *  - Internacional: até 15 dígitos (limite E.164)
 */
export function maskPhone(v: string): string {
  const trimmed = String(v || '').trim();
  const isInternational = trimmed.startsWith('+');

  if (!isInternational) {
    const d = trimmed.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  const d = trimmed.replace(/\D/g, '').slice(0, 15);
  if (d.length === 0) return '+';
  if (d.length <= 3) return `+${d}`;
  if (d.length <= 6) return `+${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 9) return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length <= 12) return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9, 12)} ${d.slice(12)}`;
}

/**
 * Normaliza para E.164 (apenas dígitos com código do país, sem +).
 * Brasil é assumido se não tiver `+` e tiver 10-11 dígitos.
 */
export function normalizePhoneE164(v: string): string {
  const trimmed = String(v || '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (hasPlus) return digits;
  if (digits.length === 10 || digits.length === 11) return '55' + digits;
  return digits;
}

/** Valida se o telefone tem dígitos suficientes pra E.164 (mínimo 10, máximo 15). */
export function validatePhone(v: string): boolean {
  const d = normalizePhoneE164(v);
  return d.length >= 10 && d.length <= 15;
}

export function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
