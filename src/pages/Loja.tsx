// Loja: compra de chaves (modelo alternativo ao Pagar.me — coexiste com comissão)
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  QrCode, Copy, Check, Clock, ArrowRight, Zap, TrendingUp, Crown,
} from 'lucide-react';
import { copyToClipboard, formatBRL } from '@/lib/utils';
import { LoaderRing } from '@/components/LoaderRing';
import { Badge, Button, Card, PageHeader, Section, inputClass } from '@/components/ui';

type PlanCode = '7dias' | '30dias' | 'vitalicio';
const VISIBLE_PLAN_CODES: PlanCode[] = ['7dias', '30dias'];

interface Tier {
  id: string;
  plan_code: PlanCode;
  min_qty: number;
  max_qty: number | null;
  unit_price_cents: number;
}

const PLAN_INFO: Record<PlanCode, { label: string; desc: string; icon: any; tagline?: string }> = {
  '7dias': { label: '7 Dias', desc: 'Acesso por 7 dias', icon: Zap },
  '30dias': { label: '30 Dias', desc: 'Acesso por 30 dias', icon: TrendingUp, tagline: 'Mais vendido' },
  vitalicio: { label: 'Vitalícia', desc: 'Sem expiração', icon: Crown },
};

const MIN_QTY = 2;

export default function Loja() {
  const { reseller } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [planCode, setPlanCode] = useState<PlanCode>('30dias');
  const [qty, setQty] = useState<number>(MIN_QTY);
  const [creating, setCreating] = useState(false);
  const [pix, setPix] = useState<{
    payment_id: string;
    purchase_id: string;
    qr: string | null;
    text: string | null;
    expires: string | null;
    amount: number;
  } | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollId, setPollId] = useState<number | null>(null);

  const userMinQty = Math.max(MIN_QTY, Number(reseller?.min_purchase_quantity) || MIN_QTY);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('reseller_pricing_tiers')
        .select('*')
        .eq('active', true)
        .order('plan_code')
        .order('min_qty');
      setTiers((data || []) as any);
      setLoadingTiers(false);
    })();
  }, []);

  useEffect(() => {
    if (qty < userMinQty) setQty(userMinQty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMinQty]);

  useEffect(
    () => () => {
      if (pollId) clearInterval(pollId);
    },
    [pollId],
  );

  const currentTiers = useMemo(() => tiers.filter((t) => t.plan_code === planCode), [tiers, planCode]);
  const currentUnit = useMemo(() => {
    const match = currentTiers.find(
      (t) => qty >= t.min_qty && (t.max_qty === null || qty <= t.max_qty),
    );
    return match?.unit_price_cents || currentTiers[0]?.unit_price_cents || 0;
  }, [currentTiers, qty]);
  const totalCents = currentUnit * qty;

  const nextDiscount = useMemo(() => {
    const sorted = [...currentTiers].sort((a, b) => a.min_qty - b.min_qty);
    const next = sorted.find((t) => t.min_qty > qty);
    if (!next) return null;
    return { qty: next.min_qty, unit: next.unit_price_cents };
  }, [currentTiers, qty]);

  const generatePix = async () => {
    if (!reseller) return;
    if (qty < userMinQty) {
      toast.error(`Mínimo de ${userMinQty} chaves por compra`);
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-reseller-payment', {
        body: {
          type: 'package',
          reseller_id: reseller.id,
          plan_code: planCode,
          quantity: qty,
          payment_method: 'pix',
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar PIX');

      const paymentId = String(data.payment_id || data.id);
      const purchaseId = data.purchase_id ? String(data.purchase_id) : null;

      setPix({
        payment_id: paymentId,
        purchase_id: purchaseId || '',
        qr: data.qr_code_base64,
        text: data.qr_code_text,
        expires: data.expires_at,
        amount: totalCents,
      });

      // Polling — usa payment_id como chave principal (mais confiável)
      const id = window.setInterval(async () => {
        let query = supabase.from('reseller_purchases').select('payment_status').limit(1);
        query = purchaseId ? query.eq('id', purchaseId) : query.eq('payment_id', paymentId);
        const { data: rows } = await query;
        const status = rows?.[0]?.payment_status;
        if (status === 'paid') {
          clearInterval(id);
          setPaid(true);
          toast.success('Pagamento confirmado!');
        } else if (status === 'cancelled' || status === 'failed') {
          clearInterval(id);
          toast.error('Pagamento não foi concluído. Tenta de novo.');
          reset();
        }
      }, 4000);
      setPollId(id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!pix?.text) return;
    await copyToClipboard(pix.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('PIX copiado');
  };

  const reset = () => {
    if (pollId) clearInterval(pollId);
    setPix(null);
    setPaid(false);
    setQty(userMinQty);
  };

  if (loadingTiers)
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );

  if (paid) {
    return (
      <Section className="max-w-[640px]">
        <Card className="p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5" />
          <div className="relative">
            <div className="size-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 grid place-items-center mx-auto mb-5">
              <Check size={22} className="text-[var(--color-primary)]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pagamento confirmado</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-3 mb-6">
              {qty} chaves do plano <strong className="text-[var(--color-text)]">{PLAN_INFO[planCode].label}</strong> liberadas
              no seu estoque.
            </p>
            <div className="flex justify-center gap-2">
              <a href="/estoque">
                <Button>
                  Ver minhas chaves <ArrowRight size={13} />
                </Button>
              </a>
              <Button onClick={reset} variant="secondary">
                Comprar mais
              </Button>
            </div>
          </div>
        </Card>
      </Section>
    );
  }

  if (pix) {
    return (
      <Section className="max-w-[640px]">
        <PageHeader title="Pague o PIX" description="Após confirmação automática, suas chaves liberam no estoque" />

        <Card className="p-8 text-center">
          <Badge tone="info">Aguardando pagamento</Badge>
          <h2 className="text-xl font-semibold tracking-tight mt-3">
            {qty} chaves · {PLAN_INFO[planCode].label}
          </h2>
          <div className="text-3xl font-semibold tracking-tight text-[var(--color-primary)] mt-2 mb-6">
            {formatBRL(pix.amount)}
          </div>

          {pix.qr && (
            <div className="inline-block p-3 rounded-lg bg-white mb-5">
              <img src={`data:image/png;base64,${pix.qr}`} alt="QR PIX" className="w-56 h-56 sm:w-64 sm:h-64" />
            </div>
          )}

          {pix.text && (
            <div className="text-left mb-5">
              <div className="text-xs text-[var(--color-text-muted)] mb-1.5">PIX copia-e-cola</div>
              <div className="flex gap-2">
                <input readOnly value={pix.text} className={inputClass + ' font-mono text-xs'} />
                <Button onClick={handleCopy} variant="secondary" className="shrink-0">
                  {copied ? <Check size={13} className="text-[var(--color-primary)]" /> : <Copy size={13} />}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm p-3 rounded-md bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)]">
            <LoaderRing size={14} className="text-[var(--color-primary)]" />
            <span>Verificando pagamento (atualiza sozinho)</span>
          </div>

          <button
            onClick={reset}
            className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Cancelar e voltar
          </button>
        </Card>
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader
        title="Comprar licenças"
        description="Compre lotes com desconto progressivo · revenda pelo preço que quiser"
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-sm font-medium mb-1">1 · Escolha o plano</div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Cada chave libera o DSL pelo período do plano escolhido pra um cliente final.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VISIBLE_PLAN_CODES.map((p) => {
                const Icon = PLAN_INFO[p].icon;
                const active = planCode === p;
                const cheapest = tiers
                  .filter((t) => t.plan_code === p)
                  .reduce((min, t) => Math.min(min, t.unit_price_cents), Infinity);
                return (
                  <button
                    key={p}
                    onClick={() => setPlanCode(p)}
                    className={
                      'text-left p-4 rounded-md border transition-all ' +
                      (active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-border-hover)]')
                    }
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className={active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'} />
                      {PLAN_INFO[p].tagline && <Badge tone="success">{PLAN_INFO[p].tagline}</Badge>}
                    </div>
                    <div className="text-sm font-medium">{PLAN_INFO[p].label}</div>
                    <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{PLAN_INFO[p].desc}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-2">a partir de</div>
                    <div className="text-base font-semibold tracking-tight">
                      {formatBRL(cheapest)}
                      <span className="text-xs font-normal text-[var(--color-text-dim)] ml-1">/chave</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium mb-1">2 · Quantidade</div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Mínimo {userMinQty} chaves · máximo 500 por compra
            </p>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setQty(Math.max(userMinQty, qty - 1))}
                variant="secondary"
                className="!w-10 !px-0 shrink-0"
                disabled={qty <= userMinQty}
              >
                −
              </Button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(userMinQty, Math.min(500, parseInt(e.target.value) || userMinQty)))}
                className={inputClass + ' text-center font-mono text-lg'}
                min={userMinQty}
                max={500}
              />
              <Button
                onClick={() => setQty(Math.min(500, qty + 1))}
                variant="secondary"
                className="!w-10 !px-0 shrink-0"
                disabled={qty >= 500}
              >
                +
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {[2, 5, 10, 25, 50, 100].filter(p => p >= userMinQty).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setQty(preset)}
                  className={
                    'text-xs px-2.5 py-1 rounded-md ' +
                    (qty === preset
                      ? 'bg-[var(--color-primary)] text-black font-medium'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]')
                  }
                >
                  {preset}
                </button>
              ))}
            </div>

            {nextDiscount && (
              <div className="mt-4 p-3 rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 text-xs flex items-center gap-2">
                <TrendingUp size={12} className="text-[var(--color-primary)] shrink-0" />
                <span className="text-[var(--color-text-muted)]">
                  Compre <span className="text-[var(--color-text)] font-medium">{nextDiscount.qty}</span> ou mais e o preço cai pra{' '}
                  <span className="text-[var(--color-primary)] font-medium">{formatBRL(nextDiscount.unit)}/chave</span>
                </span>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium mb-1">Tabela de desconto · {PLAN_INFO[planCode].label}</div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Quanto mais chaves, menor o preço unitário</p>
            <div className="space-y-2">
              {currentTiers.map((t) => {
                const inRange = qty >= t.min_qty && (t.max_qty === null || qty <= t.max_qty);
                return (
                  <div
                    key={t.id}
                    className={
                      'flex items-center justify-between p-3 rounded-md border ' +
                      (inRange
                        ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/40')
                    }
                  >
                    <div className="text-sm">
                      <span className="font-mono">{t.min_qty}</span>
                      {t.max_qty ? (
                        <>
                          {' a '}
                          <span className="font-mono">{t.max_qty}</span>
                        </>
                      ) : (
                        <> ou mais</>
                      )}{' '}
                      chaves
                    </div>
                    <div className="text-sm font-mono">
                      {formatBRL(t.unit_price_cents)}
                      <span className="text-xs text-[var(--color-text-dim)] ml-1">/chave</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="p-6 h-fit lg:sticky lg:top-6">
          <div className="text-sm font-medium mb-4">Resumo</div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Plano</span>
              <span>{PLAN_INFO[planCode].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Quantidade</span>
              <span className="font-mono">{qty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Preço por chave</span>
              <span className="font-mono">{formatBRL(currentUnit)}</span>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] mt-5 pt-5">
            <div className="flex justify-between items-baseline mb-5">
              <span className="text-sm text-[var(--color-text-muted)]">Total</span>
              <span className="text-2xl font-semibold tracking-tight">{formatBRL(totalCents)}</span>
            </div>

            <Button onClick={generatePix} disabled={creating} size="lg" className="w-full">
              {creating ? (
                <LoaderRing size={16} />
              ) : (
                <>
                  <QrCode size={14} /> Pagar com PIX
                </>
              )}
            </Button>
          </div>

          <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-2 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-start gap-2">
              <Check size={12} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
              <span>Chaves liberadas no estoque após pagamento</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={12} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
              <span>Sem prazo pra usar (use quando quiser)</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={12} className="text-[var(--color-text-dim)] mt-0.5 shrink-0" />
              <span>PIX expira em 15 min</span>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
