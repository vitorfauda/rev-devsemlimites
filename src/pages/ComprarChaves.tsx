// ============================================================
// "Meus Links" — link de venda + dicas de divulgação
// ============================================================
// Conceito novo: revenda recebe por COMISSÃO, não compra mais chaves.
// (Arquivo mantém nome ComprarChaves.tsx pra rota legacy /comprar-chaves)
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Link as LinkIcon, Copy, Check, MessageCircle, Send,
  ArrowRight, Sparkles, Image as ImageIcon, FileText,
  ShieldCheck, Lightbulb, TrendingUp,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', diamante: 'Diamante', lendario: 'Lendário',
};

export default function MeusLinks() {
  const { reseller } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  if (!reseller) return null;

  const saleUrl = reseller.slug ? `https://pay.devsemlimites.site/c/${reseller.slug}` : null;
  const onboardingPending = !reseller.pagarme_recipient_id || reseller.pagarme_kyc_status !== 'approved';

  const copy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopied(key);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  const messages = [
    {
      id: 'amigavel',
      label: 'Amigável (WhatsApp/grupos)',
      text: `Conheci uma extensão que diminui drasticamente o consumo de créditos do Lovable. Estou usando há um tempo e nunca mais tive problema de "out of credits". Quem usa Lovable e quer testar, dá uma olhada aqui:\n\n${saleUrl}`,
    },
    {
      id: 'direta',
      label: 'Direta (X/Twitter/grupos)',
      text: `Cansado de ficar sem crédito no Lovable no meio do projeto? Tem uma extensão que dá prompts ilimitados por R$ 97/mês. Já testei. Funciona.\n\n${saleUrl}`,
    },
    {
      id: 'agressiva',
      label: 'Agressiva (TikTok/Reels)',
      text: `Gente, eu PAREI de pagar R$ 250 de crédito por semana no Lovable. Descobri uma extensão que dá prompts ILIMITADOS por R$ 97 fixos no mês. Mostro como funciona AQUI 👇\n\n${saleUrl}`,
    },
  ];

  const encodedUrl = encodeURIComponent(saleUrl || '');
  const encodedMsg = encodeURIComponent(`Conheci uma extensão que dá prompts ilimitados no Lovable. Vale conferir: ${saleUrl}`);
  const shareLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodedMsg}`, icon: MessageCircle, color: 'text-emerald-400' },
    { name: 'Twitter/X', url: `https://twitter.com/intent/tweet?text=${encodedMsg}`, icon: Send, color: 'text-blue-400' },
    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`, icon: Send, color: 'text-cyan-400' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
          <LinkIcon className="size-7 text-primary" /> Meus Links
        </h1>
        <p className="text-text-muted mb-6">
          Toda venda que entrar pelo seu link gera comissão automática direto na sua conta Pagar.me.
        </p>

        {onboardingPending && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-4">
            <ShieldCheck className="size-6 text-amber-300 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-100">Configure sua conta de recebimento primeiro</h3>
              <p className="text-sm text-amber-200/80 mt-1 mb-3">
                Pra liberar seu link e começar a receber comissões, complete o onboarding Pagar.me.
              </p>
              <Link to="/onboarding-pagarme" className="cta-neon inline-flex items-center gap-2 !py-2 !px-4 text-sm">
                Configurar agora <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {saleUrl && !onboardingPending && (
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-2 border-emerald-500/30 p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Sparkles className="size-5 text-emerald-400" />
              <h2 className="font-display font-bold text-lg">Seu link único</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold uppercase tracking-wider">
                Comissão {reseller.commission_percent ?? 60}%
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 rounded-xl p-3 mb-4 border border-emerald-500/20">
              <code className="flex-1 text-sm sm:text-base font-mono text-emerald-400 break-all">{saleUrl}</code>
              <button
                onClick={() => copy(saleUrl, 'main')}
                className="cta-neon !py-2 !px-4 text-sm inline-flex items-center gap-2 shrink-0"
              >
                {copied === 'main' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'main' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {shareLinks.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="cta-ghost !py-2 !px-3 text-sm inline-flex items-center gap-2">
                  <s.icon size={14} className={s.color} /> Compartilhar no {s.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-3 mb-6">
          <Step num={1} title="Compartilhe" description="Posta o link em qualquer canal: WhatsApp, IG, TikTok, grupos, comunidades" />
          <Step num={2} title="Cliente compra" description="Sem você precisar fazer nada — checkout cuida de tudo" />
          <Step num={3} title="Você recebe" description="Comissão cai automática no seu Pagar.me. Saca quando quiser." />
        </div>

        <div className="holo-card p-5 mb-6">
          <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Mensagens prontas pra divulgar
          </h2>
          <p className="text-sm text-text-muted mb-4">Copia, cola e ajusta do seu jeito. Já vem com seu link.</p>
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{m.label}</span>
                  <button onClick={() => copy(m.text, m.id)} className="cta-ghost !py-1.5 !px-3 text-xs inline-flex items-center gap-1">
                    {copied === m.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied === m.id ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-line">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="holo-card p-5 mb-6">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-primary" /> Onde divulgar pra fechar mais
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Tip emoji="💬" title="Grupos WhatsApp / Discord" desc="Comunidades de devs, no-code, IA, indie hackers" />
            <Tip emoji="🎥" title="TikTok / Reels" desc='Mostra antes/depois: "eu pagava R$ 250/sem, agora R$ 97/mês"' />
            <Tip emoji="🐦" title="X / Twitter" desc='Tweet com print de "out of credits": "isso não acontece mais comigo"' />
            <Tip emoji="📺" title="YouTube / Live" desc='"Como criar projetos no Lovable sem se preocupar com créditos"' />
            <Tip emoji="📰" title="Newsletter / blog" desc="Reviews honestas pesam muito. Compartilha tua experiência" />
            <Tip emoji="🧑‍💼" title="LinkedIn" desc='"Reduzi meu custo Lovable em 90% com essa stack"' />
          </div>
        </div>

        <div className="holo-card p-5 mb-6">
          <h2 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
            <ImageIcon size={18} className="text-primary" /> Material de apoio
          </h2>
          <p className="text-sm text-text-muted mb-3">
            Banners, logos e vídeos prontos pra postar. <span className="text-amber-400">Em construção</span> — em breve.
          </p>
          <Link to="/materiais" className="text-sm text-primary hover:gap-2 inline-flex items-center gap-1 transition-all">
            Ver materiais <ArrowRight size={14} />
          </Link>
        </div>

        <Link to="/escala" className="block holo-card p-5 hover:border-primary/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 grid place-items-center">
              <TrendingUp className="size-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Plano de Escala — quanto você pode ganhar</div>
              <div className="text-xs text-text-muted">
                Tier atual: {TIER_LABEL[reseller.tier || 'bronze']} · Veja projeção, ranking e calculadora de meta
              </div>
            </div>
            <ArrowRight size={18} className="text-text-muted" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

function Step({ num, title, description }: { num: number; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
      <div className="size-8 rounded-full bg-primary/15 text-primary font-bold grid place-items-center mb-3 text-sm">{num}</div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs text-text-muted">{description}</div>
    </div>
  );
}

function Tip({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <span className="text-xl shrink-0">{emoji}</span>
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-text-muted mt-0.5">{desc}</div>
        </div>
      </div>
    </div>
  );
}
