import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Phone, Clock, Send, Check, Copy, AlertCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoaderRing } from '@/components/LoaderRing';
import { maskPhone, copyToClipboard, formatDateTime, normalizePhoneE164, validatePhone } from '@/lib/utils';
import { Badge, Button, ButtonLink, Card, PageHeader, Section, inputClass } from '@/components/ui';

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
  const { reseller } = useAuth();
  const [phone, setPhone] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    if (!reseller) return;
    const { data } = await supabase
      .from('licenses')
      .select('id, license_key, expires_at, created_at, customer:customers(phone)')
      .eq('reseller_id', reseller.id)
      .ilike('notes', '%reseller_test%')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reseller]);

  const submit = async () => {
    if (!reseller) {
      toast.error('Carregando sua conta…');
      return;
    }
    if (!validatePhone(phone)) {
      toast.error('WhatsApp inválido. Use o formato +55 27 99999-9999 ou +351 926 670 080');
      return;
    }
    const clean = normalizePhoneE164(phone);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reseller-test', {
        body: { reseller_id: reseller.id, phone: clean, minutes: Math.min(10, minutes) },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar teste');
      setResult(data);
      if (data.sent) toast.success('Teste enviado no WhatsApp');
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Chave copiada');
  };

  const resetForm = () => {
    setResult(null);
    setPhone('');
    setMinutes(10);
  };

  return (
    <Section>
      <PageHeader
        title="Enviar teste"
        description="Gere licenças de teste de até 10 minutos pra prospects"
      />

      {result ? (
        <Card className="p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-5 p-4 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
            <Check size={16} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <div className="text-sm font-medium text-[var(--color-primary)]">Teste enviado</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Cliente recebeu chave + link de download + instruções
              </div>
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mb-2">Chave gerada</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm break-all font-mono">
                {result.license_key}
              </code>
              <Button onClick={copyKey} variant="secondary" className="shrink-0">
                {copied ? <Check size={14} className="text-[var(--color-primary)]" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)]">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-0.5">WhatsApp</div>
              <div className="text-sm font-mono">{
                // BR (12/13 digits with 55 prefix): mostra como (DD) X XXXX-XXXX
                // Internacional: mostra +XXX XXX XXX XXX
                result.phone.startsWith('55') && (result.phone.length === 12 || result.phone.length === 13)
                  ? maskPhone(result.phone.slice(2))
                  : maskPhone('+' + result.phone)
              }</div>
            </div>
            <div className="p-3 rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)]">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase mb-0.5">Duração</div>
              <div className="text-sm font-medium text-[var(--color-primary)]">{result.duration}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-5 p-3 rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)]">
            <span>
              Testes hoje:{' '}
              <span className="text-[var(--color-text)] font-medium">{result.tests_used_today}/20</span>
            </span>
            <span>
              Restantes: <span className="text-[var(--color-primary)] font-medium">{result.tests_remaining}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={resetForm} variant="secondary">
              Enviar outro
            </Button>
            <ButtonLink href={`https://wa.me/${result.phone}`} target="_blank" rel="noreferrer">
              <MessageCircle size={13} /> Abrir conversa
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
          <Card className="p-6">
            <div className="text-sm font-medium mb-1">Dispare um teste</div>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              Cliente recebe chave + instalação via WhatsApp.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">WhatsApp do cliente</label>
                <div className="relative">
                  <Phone
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    maxLength={20}
                    placeholder="(27) 99999-9999 ou +351 926 670 080"
                    className={inputClass + ' pl-10'}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">
                  Duração (minutos, máx 10)
                </label>
                <div className="relative">
                  <Clock
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className={inputClass + ' pl-10 font-mono'}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[3, 5, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutes(m)}
                      className={
                        'text-xs px-2.5 py-1 rounded-md ' +
                        (minutes === m
                          ? 'bg-[var(--color-primary)] text-black font-medium'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]')
                      }
                    >
                      {m}min
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/20 flex gap-2 text-xs">
                <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-amber-300">
                  Limite: 20 testes/dia. Use com critério — só pra leads interessados.
                </div>
              </div>

              <Button onClick={submit} disabled={loading || !phone} size="lg" className="w-full mt-2">
                {loading ? <LoaderRing size={16} /> : <><Send size={14} /> Gerar e enviar</>}
              </Button>
            </div>
          </Card>

          <aside className="space-y-4">
            <Card className="p-5">
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] mb-3">
                O que o cliente recebe
              </div>
              <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
                {[
                  'Chave de licença formatada',
                  'Link de download da extensão',
                  'Duração e hora de expiração',
                  'Passo a passo de instalação',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2">
                    <Check size={12} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] mb-3">
                Dicas de conversão
              </div>
              <ul className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
                <li>• Liga pro lead antes de mandar o teste</li>
                <li>• Acompanha nos 10 min — tira dúvidas ao vivo</li>
                <li>• Quando acabar, oferece a vitalícia</li>
              </ul>
            </Card>
          </aside>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10 max-w-5xl">
          <h2 className="text-lg font-medium mb-4">Testes recentes</h2>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
                  <th className="font-normal text-left p-3">Quando</th>
                  <th className="font-normal text-left p-3">WhatsApp</th>
                  <th className="font-normal text-left p-3">Chave</th>
                  <th className="font-normal text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const expired = h.expires_at && new Date(h.expires_at) < new Date();
                  return (
                    <tr key={h.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="p-3 text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(h.created_at)}
                      </td>
                      <td className="p-3 text-xs font-mono">{
                        h.customer?.phone
                          ? (h.customer.phone.startsWith('55') && (h.customer.phone.length === 12 || h.customer.phone.length === 13)
                              ? maskPhone(h.customer.phone.slice(2))
                              : maskPhone('+' + h.customer.phone))
                          : '—'
                      }</td>
                      <td className="p-3">
                        <code className="font-mono text-xs">{h.license_key}</code>
                      </td>
                      <td className="p-3">
                        <Badge tone={expired ? 'neutral' : 'success'}>{expired ? 'Expirou' : 'Ativa'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </Section>
  );
}
