import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Zap, Phone, Clock, Send, Check, Copy, AlertCircle, MessageCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { LoaderRing } from '@/components/LoaderRing';
import { maskPhone, copyToClipboard, formatDateTime } from '@/lib/utils';

type TestResult = {
  license_key: string;
  duration: string;
  expires_at: string;
  phone: string;
  sent: boolean;
  tests_used_today: number;
  tests_remaining: number;
};

export default function EnviarTeste() {
  const { session, reseller } = useAuth();
  const [phone, setPhone] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    if (!reseller) return;
    const { data } = await supabase.from('licenses')
      .select('id, license_key, expires_at, created_at, customer:customers(phone)')
      .eq('reseller_id', reseller.id)
      .ilike('notes', '%reseller_test%')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  useEffect(() => { loadHistory(); }, [reseller]);

  const submit = async () => {
    if (!reseller) { toast.error('Carregando sua conta...'); return; }
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { toast.error('WhatsApp inválido'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reseller-test', {
        body: {
          reseller_id: reseller.id,
          phone: clean,
          minutes: Math.min(10, minutes),
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar teste');
      setResult(data);
      if (data.sent) toast.success('Teste enviado no WhatsApp!');
      else toast.warning('Licença criada mas WhatsApp falhou');
      loadHistory();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!result) return;
    await copyToClipboard(result.license_key);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Chave copiada!');
  };

  const resetForm = () => {
    setResult(null);
    setPhone('');
    setMinutes(10);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-start gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-accent-cyan" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Enviar teste</h1>
          <p className="text-text-muted text-sm mt-1">Gere licenças de teste de até 10 minutos pra prospects</p>
        </div>
      </div>

      {result ? (
        // ============ TELA DE SUCESSO ============
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="holo-card holo-permanent p-6 sm:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-primary/10 border border-primary/30">
            <Check size={18} className="text-primary shrink-0" />
            <div>
              <div className="font-semibold text-primary text-sm">Teste enviado com sucesso</div>
              <div className="text-xs text-text-muted">Cliente recebeu chave + link de download + instruções no WhatsApp</div>
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[10px] text-text-dim uppercase tracking-widest font-semibold mb-2">Chave gerada</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-xl bg-void/50 border text-xs sm:text-sm break-all font-mono" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
                {result.license_key}
              </code>
              <button onClick={copyKey} className="cta-ghost !px-3 !py-3 shrink-0">
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="text-[10px] text-text-dim uppercase mb-1">WhatsApp</div>
              <div className="text-sm font-mono">{maskPhone(result.phone.slice(2))}</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <div className="text-[10px] text-text-dim uppercase mb-1">Duração</div>
              <div className="text-sm font-semibold text-accent-cyan">{result.duration}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted mb-6 p-3 rounded-xl bg-white/5">
            <span>Testes hoje: <span className="text-text-primary font-semibold">{result.tests_used_today}/20</span></span>
            <span>Restantes: <span className="text-primary font-semibold">{result.tests_remaining}</span></span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={resetForm} className="cta-ghost">Enviar outro</button>
            <a href={`https://wa.me/${result.phone}`} target="_blank" rel="noreferrer" className="cta-neon flex items-center justify-center gap-2">
              <span className="relative z-10 flex items-center gap-2"><MessageCircle size={14} /> Abrir conversa</span>
            </a>
          </div>
        </motion.div>
      ) : (
        // ============ FORM ============
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
          <div className="holo-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-accent-cyan" />
              <h3 className="font-display font-bold">Dispare um teste agora</h3>
            </div>
            <p className="text-sm text-text-muted mb-6">
              Um passo, um envio. Cliente recebe chave + instalação via WhatsApp.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">WhatsApp do cliente</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim z-10" />
                  <input
                    value={phone}
                    onChange={e => setPhone(maskPhone(e.target.value))}
                    maxLength={15}
                    placeholder="(27) 99999-9999"
                    className="input-dsl pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-2">Duração (em minutos, máx 10)</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim z-10" />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={minutes}
                    onChange={e => setMinutes(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="input-dsl pl-10 font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[3, 5, 10].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutes(m)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${minutes === m ? 'bg-primary text-void font-semibold' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}
                    >
                      {m}min
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent-gold/10 border border-accent-gold/25 flex gap-3 text-xs">
                <AlertCircle size={14} className="text-accent-gold shrink-0 mt-0.5" />
                <div className="text-text-muted">
                  Limite: <span className="text-accent-gold font-semibold">20 testes/dia</span> por conta de revendedor.
                  Use com critério — são pra leads interessados, não pra toda lista.
                </div>
              </div>

              <button onClick={submit} disabled={loading || !phone} className="cta-neon w-full flex items-center justify-center gap-2 mt-2">
                {loading ? <LoaderRing size={18} /> : (
                  <span className="relative z-10 flex items-center gap-2">
                    <Send size={16} /> Gerar e enviar no WhatsApp
                  </span>
                )}
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="holo-card p-5">
              <h4 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">O que o cliente recebe</h4>
              <div className="space-y-2 text-xs text-text-muted">
                <div className="flex items-start gap-2"><Check size={12} className="text-primary mt-0.5 shrink-0" /> Chave de licença formatada</div>
                <div className="flex items-start gap-2"><Check size={12} className="text-primary mt-0.5 shrink-0" /> Link de download da extensão</div>
                <div className="flex items-start gap-2"><Check size={12} className="text-primary mt-0.5 shrink-0" /> Duração + hora de expiração</div>
                <div className="flex items-start gap-2"><Check size={12} className="text-primary mt-0.5 shrink-0" /> Passo a passo de instalação</div>
              </div>
            </div>

            <div className="holo-card p-5">
              <h4 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Dicas de conversão</h4>
              <ul className="space-y-2 text-xs text-text-muted">
                <li>• Liga pro lead <span className="text-text-primary">antes</span> de mandar o teste</li>
                <li>• Acompanha o cliente nos 10 min — tira dúvidas ao vivo</li>
                <li>• Quando acabar, oferece a vitalícia</li>
              </ul>
            </div>
          </aside>
        </div>
      )}

      {/* ============ HISTÓRICO ============ */}
      {history.length > 0 && (
        <div className="mt-10 max-w-5xl">
          <h2 className="text-lg font-display font-bold mb-4">Testes recentes</h2>
          <div className="holo-card overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-text-muted text-left text-xs uppercase tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <th className="p-3 font-medium">Quando</th>
                    <th className="p-3 font-medium">WhatsApp</th>
                    <th className="p-3 font-medium">Chave</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t: any) => {
                    const expired = t.expires_at && new Date(t.expires_at) < new Date();
                    return (
                      <tr key={t.id} className="border-b hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="p-3 text-xs text-text-muted">{formatDateTime(t.created_at)}</td>
                        <td className="p-3 text-xs font-mono">{t.customer?.phone ? maskPhone(String(t.customer.phone).slice(-11)) : '—'}</td>
                        <td className="p-3"><code className="text-xs">{t.license_key?.substring(0, 16)}...</code></td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${expired ? 'bg-white/5 text-text-dim' : 'bg-primary/15 text-primary'}`}>
                            {expired ? 'expirado' : 'ativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
