import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ShieldCheck, ShieldOff, Smartphone, Copy, Check, KeyRound, Download,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard } from '@/lib/utils';
import { Badge, Button, Card, PageHeader, Section, inputClass } from '@/components/ui';

interface Factor {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string;
  totp?: { qr_code: string; secret: string; uri: string };
}

export default function Seguranca() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<null | { id: string; qr: string; secret: string }>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackup, setShowBackup] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [disableModal, setDisableModal] = useState<null | { factorId: string }>(null);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  const loadFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const all = [...(data?.totp || []), ...((data as any)?.phone || [])];
      setFactors(all as any);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar 2FA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Dev Sem Limites',
        friendlyName: `DSL · ${new Date().toLocaleDateString('pt-BR')}`,
      });
      if (error) throw error;
      setEnrollData({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (e: any) {
      toast.error(e.message || 'Falha ao iniciar 2FA');
    } finally {
      setEnrolling(false);
    }
  };

  const confirmEnroll = async () => {
    if (!enrollData) return;
    if (!/^\d{6}$/.test(verifyCode)) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    setVerifying(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
      if (chErr) throw chErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (error) throw error;

      const codes = Array.from({ length: 10 }, () => {
        const bytes = crypto.getRandomValues(new Uint8Array(5));
        return Array.from(bytes)
          .map((b) => b.toString(36).padStart(2, '0').toUpperCase())
          .join('')
          .substring(0, 10)
          .match(/.{1,5}/g)!
          .join('-');
      });

      try {
        const hashed = await Promise.all(
          codes.map(async (c) => {
            const buf = new TextEncoder().encode(c);
            const hash = await crypto.subtle.digest('SHA-256', buf);
            return Array.from(new Uint8Array(hash))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
          }),
        );
        await supabase
          .from('resellers')
          .update({
            tfa_method: 'totp',
            tfa_backup_codes_encrypted: hashed,
            tfa_enabled_at: new Date().toISOString(),
          })
          .eq('user_id', session?.user.id);
      } catch {}

      setBackupCodes(codes);
      setShowBackup(true);
      setEnrollData(null);
      setVerifyCode('');
      toast.success('2FA ativado');
      await loadFactors();
    } catch (e: any) {
      toast.error(e.message || 'Código inválido');
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnroll = async () => {
    if (enrollData) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollData.id });
      } catch {}
    }
    setEnrollData(null);
    setVerifyCode('');
  };

  const disable = (factorId: string) => {
    setDisableModal({ factorId });
    setDisableCode('');
  };

  const confirmDisable = async () => {
    if (!disableModal) return;
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }
    setDisabling(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: disableModal.factorId });
      if (chErr) throw chErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: disableModal.factorId,
        challengeId: challenge.id,
        code: disableCode,
      });
      if (verifyErr) throw new Error('Código inválido');

      const { error } = await supabase.auth.mfa.unenroll({ factorId: disableModal.factorId });
      if (error) throw error;

      await supabase
        .from('resellers')
        .update({ tfa_method: null, tfa_backup_codes_encrypted: null, tfa_enabled_at: null })
        .eq('user_id', session?.user.id);

      toast.success('2FA desativado');
      setDisableModal(null);
      setDisableCode('');
      await loadFactors();
    } catch (e: any) {
      toast.error(e.message || 'Falha ao desativar');
    } finally {
      setDisabling(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `DEV SEM LIMITES — Códigos de Backup 2FA
Gerados: ${new Date().toLocaleString('pt-BR')}
Email: ${session?.user.email}

Cada código só pode ser usado UMA vez. Guarde em local seguro.

${backupCodes.map((c, i) => `${(i + 1).toString().padStart(2, ' ')}.  ${c}`).join('\n')}
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsl-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySecret = async () => {
    if (!enrollData) return;
    await copyToClipboard(enrollData.secret);
    setCopiedSecret(true);
    toast.success('Segredo copiado');
    setTimeout(() => setCopiedSecret(false), 1500);
  };

  const enrolledFactor = factors.find((f) => f.status === 'verified');

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

  return (
    <Section className="max-w-[800px]">
      <PageHeader title="Segurança" description="Proteja sua conta com autenticação em duas etapas" />

      {/* Status */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          {enrolledFactor ? (
            <>
              <div className="size-10 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 grid place-items-center shrink-0">
                <ShieldCheck size={18} className="text-[var(--color-primary)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">2FA ativo (TOTP)</span>
                  <Badge tone="success">Ativo</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Sua conta está protegida por código de aplicativo autenticador.
                </p>
                <Button onClick={() => disable(enrolledFactor.id)} variant="secondary" size="sm" className="mt-4">
                  <ShieldOff size={13} /> Desativar 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="size-10 rounded-md bg-amber-500/10 border border-amber-500/20 grid place-items-center shrink-0">
                <ShieldCheck size={18} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">2FA não está ativo</span>
                  <Badge tone="warning">Recomendado</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Recomendamos ativar pra proteger sua conta — especialmente pra ações sensíveis como saques.
                </p>
                {!enrollData && (
                  <Button onClick={startEnroll} disabled={enrolling} size="sm" className="mt-4">
                    {enrolling ? <LoaderRing size={14} /> : <Smartphone size={13} />}
                    Ativar com app autenticador
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Enrollment */}
      {enrollData && (
        <Card className="p-6 mb-6">
          <div className="text-sm font-medium mb-5 flex items-center gap-2">
            <Smartphone size={14} /> Configure no app
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                <span className="text-[var(--color-text)] font-medium">1.</span> Abra Google Authenticator, Authy, 1Password ou similar
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                <span className="text-[var(--color-text)] font-medium">2.</span> Escaneie o QR Code:
              </p>
              <div className="bg-white p-3 rounded-lg inline-block">
                <img src={enrollData.qr} alt="QR Code 2FA" className="w-44 h-44" />
              </div>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                  Não consegue escanear?
                </summary>
                <div className={'mt-2 flex items-center gap-2 ' + inputClass + ' h-auto py-2'}>
                  <code className="flex-1 font-mono text-xs break-all">{enrollData.secret}</code>
                  <button onClick={copySecret} className="size-6 grid place-items-center hover:bg-white/5 rounded">
                    {copiedSecret ? <Check size={11} className="text-[var(--color-primary)]" /> : <Copy size={11} />}
                  </button>
                </div>
              </details>
            </div>

            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                <span className="text-[var(--color-text)] font-medium">3.</span> Digite o código de 6 dígitos do app:
              </p>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={inputClass + ' text-center text-2xl tracking-[0.5em] font-mono h-12'}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={cancelEnroll} disabled={verifying} variant="secondary" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={confirmEnroll} disabled={verifying || verifyCode.length !== 6} className="flex-1">
                  {verifying ? <LoaderRing size={14} /> : <ShieldCheck size={13} />}
                  Ativar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Backup codes */}
      {showBackup && backupCodes.length > 0 && (
        <Card className="p-6 mb-6 border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={14} className="text-amber-400" />
            <div className="text-sm font-medium">Salve seus códigos de backup agora</div>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Se perder acesso ao app, use um desses códigos pra entrar. Cada código funciona apenas{' '}
            <strong className="text-[var(--color-text)]">uma vez</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2 font-mono text-sm"
              >
                <span className="text-[var(--color-text-dim)]">{(i + 1).toString().padStart(2, '0')}.</span>{' '}
                <span className="text-[var(--color-primary)]">{code}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadBackupCodes} size="sm">
              <Download size={13} /> Baixar como TXT
            </Button>
            <Button onClick={() => setShowBackup(false)} variant="secondary" size="sm">
              Já salvei, fechar
            </Button>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-5 text-xs text-[var(--color-text-muted)]">
        <div className="text-sm font-medium text-[var(--color-text)] mb-2">Como funciona</div>
        <ul className="space-y-1.5 leading-relaxed">
          <li>• <strong className="text-[var(--color-text)]">TOTP</strong> = Time-based One-Time Password</li>
          <li>• Apps recomendados: Google Authenticator, Authy, 1Password, Microsoft Authenticator</li>
          <li>• A cada 30 segundos um novo código é gerado pelo app</li>
          <li>• Funciona até offline (sem precisar de internet no celular)</li>
          <li>• Códigos de backup são pra emergência (perda de celular)</li>
        </ul>
      </Card>

      {/* Disable modal */}
      {disableModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !disabling && setDisableModal(null)}
        >
          <Card className="max-w-md w-full p-6">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-md bg-red-500/10 border border-red-500/20 grid place-items-center">
                  <ShieldOff size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium">Desativar 2FA?</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Sua conta vai ficar menos protegida</p>
                </div>
              </div>

              <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-3 mb-4 text-xs text-amber-300 leading-relaxed">
                Pra confirmar, digite o código atual do seu app autenticador. Sem isso, ninguém
                consegue desativar (nem você sem o app).
              </div>

              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={inputClass + ' text-center text-2xl tracking-[0.5em] font-mono h-12'}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmDisable();
                }}
              />

              <div className="flex gap-2 mt-4">
                <Button onClick={() => setDisableModal(null)} disabled={disabling} variant="secondary" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDisable}
                  disabled={disabling || disableCode.length !== 6}
                  className="flex-1 !bg-red-500/20 !text-red-400 hover:!bg-red-500/30 !border !border-red-500/30"
                >
                  {disabling ? <LoaderRing size={14} /> : <ShieldOff size={13} />}
                  Desativar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Section>
  );
}
