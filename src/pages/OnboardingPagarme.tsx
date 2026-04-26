// Stand-by: aguardando habilitação do split de pagamentos na Pagar.me.
// Enquanto isso, o programa de revenda usa o modelo de compra de chaves.
import { Link } from 'react-router-dom';
import { Wrench, ArrowRight } from 'lucide-react';
import { Button, Card, PageHeader, Section } from '@/components/ui';

export default function OnboardingPagarme() {
  return (
    <Section className="max-w-[640px]">
      <PageHeader title="Em manutenção" />

      <Card className="p-8 text-center">
        <div className="size-12 rounded-md bg-amber-500/10 border border-amber-500/20 grid place-items-center mx-auto mb-5">
          <Wrench size={20} className="text-amber-400" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight">Onboarding Pagar.me temporariamente indisponível</h2>

        <p className="text-sm text-[var(--color-text-muted)] mt-3 leading-relaxed max-w-md mx-auto">
          A configuração de comissões automáticas via Pagar.me está em ajuste. Enquanto isso, o
          programa de revenda funciona pelo modelo de <strong className="text-[var(--color-text)]">compra de chaves</strong>:
          você compra um pacote e revende como quiser.
        </p>

        <div className="text-left rounded-md bg-[var(--color-surface-2)]/40 border border-[var(--color-border)] p-4 mt-6">
          <div className="text-xs font-medium text-[var(--color-text)] mb-2">Como funciona agora</div>
          <ul className="space-y-1.5 text-sm text-[var(--color-text-muted)]">
            <li>• Compre lotes de chaves com desconto progressivo</li>
            <li>• Revenda no preço que quiser</li>
            <li>• Mínimo de 2 chaves por compra</li>
            <li>• Sem espera de KYC ou Pagar.me</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/comprar-chaves">
            <Button>
              Comprar chaves agora <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-[var(--color-text-dim)] mt-6">
          Quando a integração com Pagar.me voltar, os revendedores que quiserem migrar pra o modelo
          de comissão automática terão prioridade.
        </p>
      </Card>
    </Section>
  );
}
