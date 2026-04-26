// Landing pública pra captação de novos revendas
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, Trophy, Sparkles, ArrowRight, CheckCircle2, Crown, Medal,
  DollarSign, Users, Zap, Target, Gift,
} from 'lucide-react';
import { formatBRL } from '@/lib/utils';

const TIERS = [
  { name: 'bronze',   emoji: '🥉', label: 'Bronze',    range: '0-9',     percent: 60 },
  { name: 'prata',    emoji: '🥈', label: 'Prata',     range: '10-24',   percent: 62.5 },
  { name: 'ouro',     emoji: '🥇', label: 'Ouro',      range: '25-49',   percent: 65 },
  { name: 'diamante', emoji: '💎', label: 'Diamante',  range: '50-99',   percent: 67.5 },
  { name: 'lendario', emoji: '👑', label: 'Lendário',  range: '100+',    percent: 70 },
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
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6">
        <div className="mesh-blob" style={{ width: 600, height: 600, top: '-10%', right: '-10%', background: '#22c55e' }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, bottom: '0%', left: '-10%', background: '#22d3ee' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary uppercase tracking-wider mb-6">
            <Sparkles size={12} /> Programa de Revendedores DSL
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-bold mb-6 leading-tight">
            Receita recorrente <br />
            <span className="bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent">
              vendendo Dev Sem Limites
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-muted mb-8 max-w-2xl mx-auto">
            Comissão de até <strong className="text-primary">70%</strong> em cada cliente. <br className="hidden sm:block" />
            Eles pagam todo mês. Você ganha todo mês. <strong>Sem precisar gerar chave nenhuma.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cadastrar" className="cta-neon inline-flex items-center justify-center gap-2 !py-3 !px-6 text-base">
              Quero ser revenda <ArrowRight size={18} />
            </Link>
            <a href="#como-funciona" className="cta-ghost inline-flex items-center justify-center gap-2 !py-3 !px-6 text-base">
              Como funciona
            </a>
          </div>

          <div className="mt-8 text-xs text-text-dim">
            Entrada única de <strong className="text-text-primary">R$ 9,90</strong> · sem mensalidade · sem letra miúda
          </div>
        </motion.div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-3">
            Como funciona
          </h2>
          <p className="text-center text-text-muted mb-10 max-w-xl mx-auto">
            Você recebe 1 link único. Compartilha. Quando alguém comprar pelo seu link, comissão cai automática.
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            <Step num={1} icon={Zap}    title="Cadastra"      desc="R$ 9,90 entrada única. Configura conta de recebimento Pagar.me em 3 min." />
            <Step num={2} icon={Sparkles} title="Compartilha" desc="Posta seu link em qualquer lugar: WhatsApp, IG, TikTok, X, grupos." />
            <Step num={3} icon={Users}  title="Cliente assina" desc="Sem você fazer nada. Checkout cuida de tudo, gera licença automática." />
            <Step num={4} icon={DollarSign} title="Você recebe" desc="Comissão cai na sua conta Pagar.me. Saca quando quiser." />
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-3">
            Quanto mais clientes, maior a comissão
          </h2>
          <p className="text-center text-text-muted mb-10 max-w-xl mx-auto">
            Sua comissão sobe automaticamente conforme você acumula clientes ativos. Sem meta forçada — você cresce no seu ritmo.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
            {TIERS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl p-5 border ${
                  t.name === 'lendario' ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/40' :
                  'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="text-4xl mb-2">{t.emoji}</div>
                <div className="font-bold text-lg">{t.label}</div>
                <div className="text-xs text-text-muted mb-3">{t.range} clientes ativos</div>
                <div className={`text-3xl font-bold ${t.name === 'lendario' ? 'text-amber-400' : 'text-primary'}`}>
                  {t.percent}%
                </div>
                <div className="text-[11px] text-text-dim">comissão por venda</div>
                {t.name === 'lendario' && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1">
                    <Gift size={12} /> + R$ 2.000 bônus único
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projeção */}
      <section className="py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-accent-cyan/5 border border-primary/30 p-6 sm:p-10">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="size-14 rounded-2xl bg-primary/15 grid place-items-center shrink-0">
                <Target className="size-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                  Projeção realista (cenário 1 venda/dia)
                </h2>
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-text-dim uppercase tracking-wider">Mês 1</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">R$ 1.892</div>
                    <div className="text-[11px] text-text-muted mt-1">30 clientes · 65% Ouro</div>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-text-dim uppercase tracking-wider">Mês 6</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">R$ 12.222</div>
                    <div className="text-[11px] text-text-muted mt-1">180 clientes · 70% Lendário</div>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-500/30">
                    <div className="text-xs text-amber-300 uppercase tracking-wider">Mês 12</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">R$ 24.444</div>
                    <div className="text-[11px] text-text-muted mt-1">360 clientes · MRR consolidado</div>
                  </div>
                </div>
                <p className="text-xs text-text-dim mt-4">
                  ⚠️ Números reais de clientes pagantes mantendo cadência. Receita recorrente: cada cliente que assina mantém pagando todo mês.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top do mês */}
      {top.length > 0 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-center mb-3 flex items-center justify-center gap-2">
              <Medal className="size-8 text-amber-400" /> Top revendas do mês
            </h2>
            <p className="text-center text-text-muted mb-8">
              Top 1 ganha bônus de R$ 500 todo mês. Pode ser você.
            </p>
            <div className="space-y-2">
              {top.map(r => (
                <div key={r.position} className={`flex items-center gap-4 p-4 rounded-xl ${
                  r.position === 1 ? 'bg-amber-500/10 border-2 border-amber-500/30' :
                  r.position <= 3 ? 'bg-white/5 border border-white/10' :
                  'bg-white/[0.02] border border-white/5'
                }`}>
                  <div className="text-3xl w-12 text-center">{r.medal || `#${r.position}`}</div>
                  <div className="flex-1">
                    <div className="font-bold">{r.name}</div>
                    <div className="text-xs text-text-muted">{r.active_customers} clientes ativos · {r.sales_in_month} vendas no mês</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">{formatBRL(r.revenue_cents)}</div>
                    <div className="text-xs text-text-dim">no mês</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <Crown className="size-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-5xl font-display font-bold mb-4">
            Pronto pra começar?
          </h2>
          <p className="text-lg text-text-muted mb-8 max-w-xl mx-auto">
            R$ 9,90 de entrada. Sem mensalidade. Sem letra miúda.
            Cancela quando quiser. Recebe direto na sua conta.
          </p>
          <Link to="/cadastrar" className="cta-neon inline-flex items-center justify-center gap-2 !py-3 !px-8 text-base">
            Quero ser revenda <ArrowRight size={18} />
          </Link>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-text-dim flex-wrap">
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Pagar.me oficial</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Saque pra qualquer banco</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Suporte WhatsApp</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ num, icon: Icon, title, desc }: { num: number; icon: any; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-white/[0.02] rounded-2xl p-5 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="size-9 rounded-xl bg-primary/15 grid place-items-center text-primary">
          <Icon size={18} />
        </div>
        <span className="text-xs text-text-dim uppercase tracking-wider">Passo {num}</span>
      </div>
      <div className="font-bold mb-1">{title}</div>
      <div className="text-sm text-text-muted">{desc}</div>
    </motion.div>
  );
}
