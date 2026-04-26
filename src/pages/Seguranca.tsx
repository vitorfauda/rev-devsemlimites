import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Copy, Check, KeyRound, Loader2, Trash2, Download } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { copyToClipboard } from '@/lib/utils';

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

  useEffect(() => { loadFactors(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Dev Sem Limites',
        friendlyName: `DSL · ${new Date().toLocaleDateString('pt-BR')}`,
      });
      if (error) throw error;
      setEnrollData({
        id: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
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

      // Gera backup codes localmente (Supabase não tem nativo, salva criptografado no DB)
      const codes = Array.from({ length: 10 }, () => {
        const bytes = crypto.getRandomValues(new Uint8Array(5));
        return Array.from(bytes).map(b => b.toString(36).padStart(2, '0').toUpperCase())
          .join('').substring(0, 10).match(/.{1,5}/g)!.join('-');
      });

      // Save backup codes hashed in resellers table
      try {
        const hashed = await Promise.all(codes.map(async (c) => {
          const buf = new TextEncoder().encode(c);
          const hash = await crypto.subtle.digest('SHA-256', buf);
          return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }));
        await supabase.from('resellers').update({
          tfa_method: 'totp',
          tfa_backup_codes_encrypted: hashed,
          tfa_enabled_at: new Date().toISOString(),
        }).eq('user_id', session?.user.id);
      } catch (e) { /* best-effort */ }

      setBackupCodes(codes);
      setShowBackup(true);
      setEnrollData(null);
      setVerifyCode('');
      toast.success('2FA ativado! 🔒');
      await loadFactors();
    } catch (e: any) {
      toast.error(e.message || 'Código inválido');
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnroll = async () => {
    if (enrollData) {
      try { await supabase.auth.mfa.unenroll({ factorId: enrollData.id }); } catch { /* ignore */ }
    }
    setEnrollData(null);
    setVerifyCode('');
  };

  const disable = (factorId: string) => {
    // Em vez de confirm() simples, abre modal pedindo código TOTP
    setDisableModal({ factorId });
    setDisableCode('');
  };

  const confirmDisable = async () => {
    if (!disableModal) return;
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error('Digite o código de 6 dígitos do app autenticador');
      return;
    }
    setDisabling(true);
    try {
      // 1) Valida o código atual via challenge → verify
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: disableModal.factorId });
      if (chErr) throw chErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: disableModal.factorId,
        challengeId: challenge.id,
        code: disableCode,
      });
      if (verifyErr) throw new Error('Código inválido');

      // 2) Só DEPOIS de validar, faz unenroll
      const { error } = await supabase.auth.mfa.unenroll({ factorId: disableModal.factorId });
      if (error) throw error;

      // 3) Limpa flags do nosso DB
      await supabase.from('resellers').update({
        tfa_method: null,
        tfa_backup_codes_encrypted: null,
        tfa_enabled_at: null,
      }).eq('user_id', session?.user.id);

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
Gerados em: ${new Date().toLocaleString('pt-BR')}
Email: ${session?.user.email}

ATENÇÃO: cada código só pode ser usado UMA vez.
Guarde em local seguro (impresso, gerenciador de senhas, etc).

${backupCodes.map((c, i) => `${(i + 1).toString().padStart(2, ' ')}.  ${c}`).join('\n')}

Se perder o app autenticador, use um desses códigos pra entrar.
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
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const enrolledFactor = factors.find(f => f.status === 'verified');

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><LoaderRing /></div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
          <Shield className="size-8 text-primary" /> Segurança
        </h1>
        <p className="text-text-muted mb-8">Proteja sua conta com autenticação em duas etapas.</p>

        {/* Status atual */}
        <div className="holo-card holo-permanent p-6 mb-6">
          <div className="flex items-start gap-4">
            {enrolledFactor ? (
              <>
                <div className="size-12 rounded-xl bg-emerald-500/20 grid place-items-center shrink-0">
                  <ShieldCheck className="size-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-300">2FA ativo (TOTP)</h3>
                  <p className="text-sm text-text-muted mt-1">
                    Sua conta tá protegida por código de aplicativo autenticador.<br />
                    {enrolledFactor.friendly_name && <span className="text-xs text-text-dim">Fator: {enrolledFactor.friendly_name}</span>}
                  </p>
                  <button
                    onClick={() => disable(enrolledFactor.id)}
                    className="mt-3 cta-ghost !py-2 text-sm inline-flex items-center gap-2 hover:bg-red-500/10 hover:border-red-500/30"
                  >
                    <ShieldOff size={14} /> Desativar 2FA
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="size-12 rounded-xl bg-amber-500/20 grid place-items-center shrink-0">
                  <Shield className="size-6 text-amber-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-100">2FA não está ativo</h3>
                  <p className="text-sm text-text-muted mt-1">
                    Recomendamos ativar pra proteger sua conta — especialmente pra ações sensíveis como saques.
                  </p>
                  {!enrollData && (
                    <button
                      onClick={startEnroll}
                      disabled={enrolling}
                      className="mt-3 cta-neon !py-2 text-sm inline-flex items-center gap-2"
                    >
                      {enrolling ? <Loader2 className="size-4 animate-spin" /> : <Smartphone size={14} />}
                      Ativar com app autenticador
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Enrollment flow */}
        {enrollData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="holo-card holo-permanent p-6 mb-6"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Smartphone className="size-5 text-primary" /> Configure no app
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div>
                <p className="text-sm text-text-muted mb-3">
                  1. Abra <strong>Google Authenticator</strong>, <strong>Authy</strong>, <strong>1Password</strong> ou similar
                </p>
                <p className="text-sm text-text-muted mb-3">
                  2. Escaneie o QR Code abaixo:
                </p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img src={enrollData.qr} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-text-muted hover:text-text-primary">Não consegue escanear? Digite manualmente</summary>
                  <div className="mt-2 flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <code className="flex-1 font-mono text-xs break-all">{enrollData.secret}</code>
                    <button onClick={copySecret} className="size-7 rounded grid place-items-center hover:bg-white/10">
                      {copiedSecret ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </details>
              </div>

              {/* Verify */}
              <div>
                <p className="text-sm text-text-muted mb-3">
                  3. Digite o código de 6 dígitos que aparece no app:
                </p>
                <input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-dsl text-center text-2xl tracking-[0.5em] font-mono"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={cancelEnroll}
                    disabled={verifying}
                    className="cta-ghost !py-2 text-sm flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmEnroll}
                    disabled={verifying || verifyCode.length !== 6}
                    className="cta-neon !py-2 text-sm flex-1 inline-flex items-center justify-center gap-2"
                  >
                    {verifying ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck size={14} />}
                    Ativar 2FA
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Backup codes shown after enrollment */}
        {showBackup && backupCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="holo-card holo-permanent p-6 mb-6 border-2 border-amber-500/30"
          >
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-amber-300">
              <KeyRound className="size-5" /> Salve seus códigos de backup AGORA
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Se perder acesso ao app autenticador, use um desses códigos pra entrar.
              Cada código só funciona <strong>uma vez</strong>. Guarda num lugar seguro.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  <span className="text-text-dim">{(i + 1).toString().padStart(2, '0')}.</span>{' '}
                  <span className="text-emerald-300">{code}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={downloadBackupCodes} className="cta-neon !py-2 text-sm inline-flex items-center gap-2">
                <Download size={14} /> Baixar como TXT
              </button>
              <button onClick={() => setShowBackup(false)} className="cta-ghost !py-2 text-sm">
                Já salvei, fechar
              </button>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="holo-card p-5 text-sm text-text-muted">
          <h4 className="font-semibold text-text-primary mb-2">📖 Como funciona</h4>
          <ul className="space-y-1.5">
            <li>• <strong>TOTP</strong> = Time-based One-Time Password</li>
            <li>• Apps recomendados: Google Authenticator, Authy, 1Password, Microsoft Authenticator</li>
            <li>• A cada 30 segundos um novo código é gerado pelo app</li>
            <li>• Funciona até offline (sem precisar de internet no celular)</li>
            <li>• Códigos de backup são pra emergência (perda de celular)</li>
          </ul>
        </div>
      </motion.div>

      {/* Modal de desativação 2FA — exige código atual */}
      {disableModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !disabling && setDisableModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="holo-card holo-permanent max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-red-500/10 grid place-items-center">
                <ShieldOff className="size-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Desativar 2FA?</h3>
                <p className="text-xs text-text-muted">Sua conta vai ficar menos protegida.</p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 mb-4 text-xs text-amber-200">
              ⚠️ Pra confirmar, digite o código atual do seu app autenticador.
              <br />Sem isso, ninguém consegue desativar (nem mesmo você sem o app).
            </div>

            <input
              value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input-dsl text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onKeyDown={e => { if (e.key === 'Enter') confirmDisable(); }}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDisableModal(null)}
                disabled={disabling}
                className="cta-ghost !py-2 text-sm flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDisable}
                disabled={disabling || disableCode.length !== 6}
                className="!py-2 text-sm flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                {disabling ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff size={14} />}
                Desativar 2FA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
