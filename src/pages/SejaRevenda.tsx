import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Sparkles, ArrowRight, CheckCircle2, Users, Zap, Target, Gift, DollarSign, Medal,
} from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import { Badge, Card, ButtonLink } from '@/components/ui';

const TIERS = [
  { name: 'bronze', label: 'Bronze', range: '0-9', percent: 60 },
  { name: 'prata', label: 'Prata', range: '10-24', percent: 62.5 },
  { name: 'ouro', label: 'Ouro', range: '25-49', percent: 65 },
  { name: 'diamante', label: 'Diamante', range: '50-99', percent: 67.5 },
  { name: 'lendario', label: 'Lendário', range: '100+', percent: 70 },
];

interface TopReseller {
  position: number;
  name: string;
  sales_in_month: number;
  revenue_cents: number;
  active_customers: number;
  medal: string | null;
}

export default function SejaRevenda() {
  const [top, setTop] = useState<TopReseller[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('get-top-resellers', { body: {} });
        if (data?.ok) setTop(data.top || []);
      } catch {}
    })();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="max-w-[1100px] mx-auto px-6 pt-20 sm:pt-28 pb-20">
        <div className="flex flex-col items-center text-center">
          <Badge tone="success">
            <Sparkles size={11} /> Programa de revendedores DSL
          </Badge>
          <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Receita recorrente vendendo{' '}
            <span className="text-[var(--color-primary)]">Dev Sem Limites</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--color-text-muted)] max-w-xl leading-relaxed">
            Comissão de até <span className="text-[var(--color-text)] font-medium">70%</span> em cada
            cliente. Eles pagam todo mês. Você ganha todo mês. Sem precisar gerar chave nenhuma.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/cadastrar">
              <ButtonLink size="lg">
                Quero ser revenda <ArrowRight size={16} />
              </ButtonLink>
            </Link>
            <ButtonLink href="#como-funciona" size="lg" variant="secondary">
              Como funciona
            </ButtonLink>
          </div>
          <div className="mt-6 text-xs text-[var(--color-text-dim)]">
            Entrada única <span className="text-[var(--color-text)] font-medium">R$ 9,90</span> · sem
            mensalidade · sem letra miúda
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="max-w-[1100px] mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge>Como funciona</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
            Você compartilha, o sistema cuida do resto
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: '01', icon: Zap, title: 'Cadastra', desc: 'R$ 9,90 entrada única. Configura conta Pagar.me em 3 minutos.' },
            { num: '02', icon: Sparkles, title: 'Compartilha', desc: 'Posta seu link em WhatsApp, Instagram, TikTok, X, grupos.' },
            { num: '03', icon: Users, title: 'Cliente assina', desc: 'Sem você fazer nada. Checkout cuida e gera licença automática.' },
            { num: '04', icon: DollarSign, title: 'Você recebe', desc: 'Comissão cai na sua conta Pagar.me. Saca quando quiser.' },
          ].map((s) => (
            <Card key={s.num} className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <s.icon size={14} className="text-[var(--color-primary)]" />
                <span className="text-xs text-[var(--color-text-dim)] font-mono">{s.num}</span>
              </div>
              <div className="font-medium mb-1.5">{s.title}</div>
              <div className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section className="max-w-[1100px] mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge>Tiers</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
            Quanto mais clientes, maior a comissão
          </h2>
          <p className="mt-3 text-[var(--color-text-muted)]">
            Sua comissão sobe automaticamente conforme acumula clientes ativos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
          {TIERS.map((t) => (
            <Card
              key={t.name}
              className={t.name === 'lendario' ? 'p-5 border-[var(--color-primary)]/40' : 'p-5'}
            >
              <div className="text-sm text-[var(--color-text-muted)]">{t.label}</div>
              <div className="text-xs text-[var(--color-text-dim)] mt-0.5 mb-3">
                {t.range} clientes ativos
              </div>
              <div
                className={
                  'text-3xl font-semibold tracking-tight ' +
                  (t.name === 'lendario' ? 'text-[var(--color-primary)]' : '')
                }
              >
                {t.percent}%
              </div>
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">
                comissão
              </div>
              {t.name === 'lendario' && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <Badge tone="success">
                    <Gift size={10} /> +R$ 2.000 bônus
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* PROJEÇÃO */}
      <section className="max-w-[900px] mx-auto px-6 py-20">
        <Card className="p-8 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 grid place-items-center shrink-0">
              <Target size={18} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">Projeção realista</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Cenário de 1 venda por dia, mantendo cadência consistente
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Mês 1', value: 'R$ 1.892', sub: '30 clientes · Ouro 65%' },
              { label: 'Mês 6', value: 'R$ 12.222', sub: '180 clientes · Lendário 70%' },
              { label: 'Mês 12', value: 'R$ 24.444', sub: '360 clientes · MRR consolidado' },
            ].map((p, i) => (
              <div
                key={i}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-4"
              >
                <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest">
                  {p.label}
                </div>
                <div className="text-2xl font-semibold tracking-tight mt-1 text-[var(--color-primary)]">
                  {p.value}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">{p.sub}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-dim)] mt-5">
            Receita recorrente: cada cliente assinante mantém pagando todo mês.
          </p>
        </Card>
      </section>

      {/* TOP DO MÊS */}
      {top.length > 0 && (
        <section className="max-w-[800px] mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <Badge tone="warning">
              <Medal size={11} /> Ranking público
            </Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Top revendas do mês
            </h2>
            <p className="mt-3 text-[var(--color-text-muted)]">
              Top 1 ganha bônus de R$ 500 todo mês. Pode ser você.
            </p>
          </div>
          <Card>
            {top.map((r, i) => (
              <div
                key={r.position}
                className={
                  'flex items-center gap-4 p-4 ' +
                  (i < top.length - 1 ? 'border-b border-[var(--color-border)]' : '')
                }
              >
                <div className="size-8 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center text-xs font-mono text-[var(--color-text-muted)]">
                  {r.position}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)]">
                    {r.active_customers} clientes · {r.sales_in_month} vendas no mês
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-[var(--color-primary)]">
                    {formatBRL(r.revenue_cents)}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">
                    no mês
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <Card className="p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Pronto pra começar?
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] max-w-md mx-auto">
              R$ 9,90 de entrada. Sem mensalidade. Cancela quando quiser. Recebe direto na sua conta.
            </p>
            <Link to="/cadastrar" className="inline-block mt-8">
              <ButtonLink size="lg">
                Quero ser revenda <ArrowRight size={16} />
              </ButtonLink>
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-dim)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-[var(--color-primary)]" /> Pagar.me oficial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-[var(--color-primary)]" /> Saque pra qualquer banco
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-[var(--color-primary)]" /> Suporte WhatsApp
              </span>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
