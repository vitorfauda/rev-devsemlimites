import { useState } from 'react';
import { MessageCircle, Users, ChevronDown } from 'lucide-react';
import { ButtonLink, Card, PageHeader, Section } from '@/components/ui';

const faqs = [
  { q: 'Como funciona o programa de revenda?', a: 'Você recebe um link único. Cada cliente que compra pelo seu link vira sua comissão recorrente — eles pagam todo mês, você recebe todo mês.' },
  { q: 'Como divulgar?', a: 'Use os materiais prontos em /materiais. Foque em grupos de devs, Instagram, WhatsApp status. O público que usa Lovable é muito receptivo.' },
  { q: 'E se cliente pedir reembolso?', a: 'Reembolsos seguem a política DSL (7 dias). Se reembolsar, a comissão correspondente é debitada do seu saldo.' },
  { q: 'Como atualizar meus dados?', a: 'Vá em /perfil e edite. Nome, WhatsApp e chave PIX são editáveis. Conta bancária só em /configuracoes com 2FA.' },
];

export default function Suporte() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section className="max-w-[800px]">
      <PageHeader title="Central de suporte" description="Estamos aqui pra te ajudar a vender mais" />

      <Card className="p-8 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="size-12 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 grid place-items-center shrink-0">
            <MessageCircle size={20} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-medium mb-0.5">Fale com nosso time</div>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">Atendimento em dias úteis das 9h às 20h</p>
            <ButtonLink
              href="https://wa.me/5527992660736?text=Sou%20revendedor%20DSL,%20preciso%20de%20ajuda"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={14} /> Falar agora
            </ButtonLink>
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-10">
        <div className="flex items-center gap-4">
          <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] grid place-items-center shrink-0">
            <Users size={15} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Grupo VIP de revendedores</div>
            <div className="text-xs text-[var(--color-text-dim)]">
              Troca de experiências, dicas de vendas e novidades
            </div>
          </div>
          <ButtonLink
            href="https://chat.whatsapp.com/JxfO7n9OCXe8EY4LIaLh9H?mode=gi_t"
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
          >
            Entrar
          </ButtonLink>
        </div>
      </Card>

      <h2 className="text-xl font-semibold tracking-tight mb-4">Dúvidas frequentes</h2>
      <div className="space-y-2">
        {faqs.map((f, i) => {
          const o = open === i;
          return (
            <Card key={i}>
              <button
                onClick={() => setOpen(o ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium pr-4">{f.q}</span>
                <ChevronDown
                  size={16}
                  className={
                    'shrink-0 transition-transform ' +
                    (o ? 'rotate-180 text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]')
                  }
                />
              </button>
              {o && <div className="px-5 pb-5 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.a}</div>}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
