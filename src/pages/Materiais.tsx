import { useState } from 'react';
import { FileText, Image as ImageIcon, Video, Copy, Check, Download } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge, Button, Card, PageHeader, Section } from '@/components/ui';

const copys = [
  {
    title: 'Story Instagram',
    text: 'Quer usar o Lovable SEM limite de créditos? Eu descobri uma forma.\n\nExtensão oficial + licença vitalícia por R$ 147.\n\nChama no DM que te passo o link.',
  },
  {
    title: 'WhatsApp Status',
    text: 'Galera, parei de pagar R$ 100/mês pro Lovable. Uso uma extensão que libera tudo.\nValor único: R$ 147. Interessado? Responde aí.',
  },
  {
    title: 'Grupo / Comunidade',
    text: 'Pra quem usa Lovable.dev e quer economizar:\n\nExtensão Dev Sem Limites libera:\n• Prompts ilimitados (sem consumir crédito)\n• Funciona em qualquer conta\n• Licença vitalícia\n\nR$ 147 pagamento único (vs R$ 100/mês do PRO).\n\nMe chama no PV que te mando.',
  },
  {
    title: 'Anúncio pago (Meta Ads)',
    text: 'HEADLINE: Lovable Ilimitado — Sem pagar mensalidade\n\nCORPO:\nA extensão oficial que libera prompts ilimitados no Lovable.dev, sem consumir créditos da sua conta.\n\n• Licença vitalícia (pagamento único)\n• Funciona em qualquer conta Lovable\n• Instalação em 2 minutos\n• Suporte dedicado via WhatsApp\n\nDe R$ 197 por R$ 147 (oferta de lançamento).\n\nCTA: Garanta sua licença',
  },
];

export default function Materiais() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
    toast.success('Copiado');
  };

  return (
    <Section>
      <PageHeader title="Kit de divulgação" description="Textos, imagens e vídeos prontos pra usar" />

      <div className="grid md:grid-cols-3 gap-3 mb-10">
        {[
          { icon: ImageIcon, title: 'Imagens Instagram', desc: '8-10 artes em formatos variados' },
          { icon: Video, title: 'Vídeos / Reels', desc: 'MP4 prontos pra postar' },
          { icon: FileText, title: 'PDF de apresentação', desc: 'Pra grupos profissionais' },
        ].map((p, i) => (
          <Card key={i} className="p-6 text-center">
            <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center mx-auto mb-3">
              <p.icon size={15} className="text-[var(--color-primary)]" />
            </div>
            <div className="text-sm font-medium mb-1">{p.title}</div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">{p.desc}</p>
            <Badge tone="warning">
              <Download size={11} /> Em breve
            </Badge>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-medium mb-4">Textos prontos</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {copys.map((c) => (
          <Card key={c.title} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">{c.title}</div>
              <Button onClick={() => copy(c.title, c.text)} variant="secondary" size="sm">
                {copied === c.title ? (
                  <>
                    <Check size={12} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] whitespace-pre-line p-3 rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] font-mono leading-relaxed">
              {c.text}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
