import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Copy, Check, MessageCircle, Send, ArrowRight, Lightbulb, ShieldCheck, FileText, Image as ImageIcon, TrendingUp,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge, Button, ButtonLink, Card, PageHeader, Section } from '@/components/ui';

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', diamante: 'Diamante', lendario: 'Lendário',
};

export default function MeusLinks() {
  const { reseller } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [tone, setTone] = useState<'amigavel' | 'direta' | 'agressiva'>('direta');

  if (!reseller) return null;

  const saleUrl = reseller.slug ? `https://pay.devsemlimites.site/c/${reseller.slug}` : null;
  const onboardingPending = !reseller.pagarme_recipient_id || reseller.pagarme_kyc_status !== 'approved';

  const copy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopied(key);
    toast.success('Copiado');
    setTimeout(() => setCopied(null), 1500);
  };

  const messages = {
    amigavel: `Conheci uma extensão que diminui drasticamente o consumo de créditos do Lovable. Estou usando há um tempo e nunca mais tive problema de "out of credits". Quem usa Lovable e quer testar:\n\n${saleUrl}`,
    direta: `Cansado de ficar sem crédito no Lovable no meio do projeto? Tem uma extensão que dá prompts ilimitados por R$ 97/mês. Já testei. Funciona.\n\n${saleUrl}`,
    agressiva: `Parei de pagar R$ 250 de crédito por semana no Lovable. Descobri uma extensão que dá prompts ILIMITADOS por R$ 97 fixos no mês. Mostro como funciona aqui:\n\n${saleUrl}`,
  };

  const encodedMsg = encodeURIComponent(`Conheci uma extensão que dá prompts ilimitados no Lovable: ${saleUrl}`);
  const encodedUrl = encodeURIComponent(saleUrl || '');
  const shareLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodedMsg}`, icon: MessageCircle },
    { name: 'Twitter/X', url: `https://twitter.com/intent/tweet?text=${encodedMsg}`, icon: Send },
    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`, icon: Send },
  ];

  return (
    <Section>
      <PageHeader
        title="Meus links"
        description="Toda venda pelo seu link gera comissão automática direto na sua Pagar.me"
      />

      {onboardingPending && (
        <Card className="mb-6 p-5 border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-amber-500/10 border border-amber-500/20 grid place-items-center shrink-0">
              <ShieldCheck size={16} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium mb-0.5">Configure seu recebimento primeiro</div>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                Pra liberar seu link e começar a receber comissões, complete o onboarding Pagar.me.
              </p>
              <Link to="/onboarding-pagarme">
                <Button size="sm">
                  Configurar agora <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {saleUrl && !onboardingPending && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Badge tone="success">Comissão {reseller.commission_percent ?? 60}%</Badge>
            <span className="text-xs text-[var(--color-text-dim)]">Slug verificado</span>
          </div>

          <div className="text-xs text-[var(--color-text-muted)] mb-2">Seu link único</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 px-4 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center font-mono text-sm">
              {saleUrl}
            </div>
            <Button onClick={() => copy(saleUrl, 'main')} variant="secondary">
              {copied === 'main' ? (
                <>
                  <Check size={14} className="text-[var(--color-primary)]" /> Copiado
                </>
              ) : (
                <>
                  <Copy size={14} /> Copiar
                </>
              )}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {shareLinks.map((s) => (
              <ButtonLink key={s.name} href={s.url} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                <s.icon size={13} /> {s.name}
              </ButtonLink>
            ))}
          </div>
        </Card>
      )}

      {/* Steps */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          { n: '01', t: 'Compartilhe', d: 'Posta o link em qualquer canal: WhatsApp, IG, TikTok, grupos.' },
          { n: '02', t: 'Cliente compra', d: 'Sem você precisar fazer nada. Checkout cuida de tudo.' },
          { n: '03', t: 'Você recebe', d: 'Comissão cai automática no seu Pagar.me. Saca quando quiser.' },
        ].map((s) => (
          <Card key={s.n} className="p-5">
            <div className="text-xs text-[var(--color-text-dim)] font-mono mb-2">{s.n}</div>
            <div className="text-sm font-medium mb-1">{s.t}</div>
            <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s.d}</div>
          </Card>
        ))}
      </div>

      {/* Mensagens prontas */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={14} className="text-[var(--color-primary)]" />
          <div className="text-sm font-medium">Mensagens prontas</div>
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mb-4">
          Escolha o tom, copie e ajuste do seu jeito
        </div>

        <div className="flex gap-1 mb-4">
          {(['amigavel', 'direta', 'agressiva'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={
                'px-3 py-1.5 rounded-md text-xs capitalize ' +
                (tone === t
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="rounded-md bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed">
          {messages[tone]}
        </div>

        <Button onClick={() => copy(messages[tone], tone)} variant="secondary" size="sm" className="mt-4">
          {copied === tone ? <Check size={13} className="text-[var(--color-primary)]" /> : <Copy size={13} />}
          {copied === tone ? 'Copiado' : 'Copiar texto'}
        </Button>
      </Card>

      {/* Onde divulgar */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-[var(--color-primary)]" />
          <div className="text-sm font-medium">Onde divulgar pra fechar mais</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['Grupos WhatsApp / Discord', 'Comunidades de devs, no-code, IA, indie hackers'],
            ['TikTok / Reels', '"Eu pagava R$ 250/sem, agora R$ 97/mês"'],
            ['X / Twitter', 'Tweet com print de "out of credits": "isso não acontece mais"'],
            ['YouTube / Live', '"Como criar projetos no Lovable sem se preocupar com créditos"'],
            ['Newsletter / blog', 'Reviews honestas pesam muito. Compartilha tua experiência'],
            ['LinkedIn', '"Reduzi meu custo Lovable em 90% com essa stack"'],
          ].map(([t, d], i) => (
            <div
              key={i}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 p-3"
            >
              <div className="text-sm font-medium">{t}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{d}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Materiais */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon size={14} className="text-[var(--color-primary)]" />
          <div className="text-sm font-medium">Material de apoio</div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Banners, logos e vídeos prontos pra postar.{' '}
          <Badge tone="warning">Em construção</Badge>
        </p>
        <Link to="/materiais" className="text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          Ver materiais <ArrowRight size={13} />
        </Link>
      </Card>

      {/* Ver escala */}
      <Link to="/escala">
        <Card className="p-5 hover:bg-[var(--color-surface-2)]/40 transition-colors">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center shrink-0">
              <TrendingUp size={15} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Plano de escala — quanto você pode ganhar</div>
              <div className="text-xs text-[var(--color-text-dim)] truncate">
                Tier atual {TIER_LABEL[reseller.tier || 'bronze']} · Veja projeção e calculadora
              </div>
            </div>
            <ArrowRight size={14} className="text-[var(--color-text-dim)] shrink-0" />
          </div>
        </Card>
      </Link>
    </Section>
  );
}
