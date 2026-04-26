import { motion } from 'framer-motion';
import { ScrollText, AlertTriangle } from 'lucide-react';

export default function Termos() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <ScrollText className="size-7 text-primary" />
          <h1 className="text-3xl font-display font-bold">Termos de Uso</h1>
        </div>
        <p className="text-text-muted text-sm mb-6">Última atualização: 26/04/2026</p>

        <article className="prose prose-invert max-w-none space-y-6 text-text-muted">

          <Section title="1. Aceite dos Termos">
            <p>Ao acessar e usar a plataforma <strong>Dev Sem Limites</strong> ("DSL"), operada por <strong>ID SERVIÇOS DIGITAIS LTDA</strong> (CNPJ 54.107.510/0001-91), você ("Usuário") concorda integralmente com estes Termos de Uso. Se não concordar, não use o serviço.</p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>A DSL oferece uma extensão de navegador (Chrome) que otimiza o consumo de créditos em ferramentas de geração de código com IA, especialmente Lovable.dev. O serviço é fornecido em modelo de assinatura (mensal ou anual) com renovação automática ou manual conforme método de pagamento escolhido.</p>
          </Section>

          <Section title="3. Planos e Pagamento">
            <h3 className="text-text-primary font-semibold mt-3">3.1 Planos disponíveis</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>1 Dia:</strong> R$ 47, pagamento único, acesso por 24 horas</li>
              <li><strong>7 Dias:</strong> R$ 67, pagamento único, acesso por 7 dias</li>
              <li><strong>Mensal:</strong> R$ 97/mês com renovação automática</li>
              <li><strong>Anual:</strong> R$ 397/ano (ou preço promocional vigente) com renovação automática</li>
            </ul>

            <h3 className="text-text-primary font-semibold mt-4">3.2 Métodos de pagamento</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cartão de crédito:</strong> cobrança automática a cada ciclo, processada via Pagar.me</li>
              <li><strong>PIX:</strong> nova cobrança gerada a cada ciclo, paga manualmente pelo Usuário</li>
            </ul>

            <h3 className="text-text-primary font-semibold mt-4">3.3 Falhas de pagamento</h3>
            <p>Caso 2 (duas) cobranças consecutivas falhem, a licença será <strong>suspensa automaticamente</strong>. Após 30 dias de inadimplência, a assinatura será <strong>cancelada definitivamente</strong>.</p>
          </Section>

          <Section title="4. Cancelamento e Reembolso">
            <h3 className="text-text-primary font-semibold mt-3">4.1 Direito de arrependimento (Art. 49 CDC)</h3>
            <p>Compras realizadas pelo site têm o direito de arrependimento de <strong>7 (sete) dias corridos</strong> a contar da contratação, conforme previsto no Código de Defesa do Consumidor.</p>

            <h3 className="text-text-primary font-semibold mt-4">4.2 Após o período de arrependimento</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Plano Mensal:</strong> cancela a renovação a qualquer momento, com acesso até o fim do ciclo já pago.</li>
              <li><strong>Plano Anual:</strong> sendo pagamento único antecipado pelo período integral, <strong>NÃO há direito a reembolso proporcional após o período de 7 dias</strong>. Acesso permanece ativo até o término do ciclo.</li>
              <li><strong>Planos 1 Dia / 7 Dias:</strong> sendo produtos digitais consumíveis em curto prazo, <strong>NÃO há reembolso após início de uso</strong>.</li>
            </ul>

            <h3 className="text-text-primary font-semibold mt-4">4.3 Pagamentos via PIX</h3>
            <p>Pagamentos via PIX <strong>NÃO são reembolsáveis</strong> pela natureza irreversível do meio, exceto em casos de cobrança comprovadamente indevida pelo sistema.</p>
          </Section>

          <Section title="5. Programa de Revendas">
            <h3 className="text-text-primary font-semibold mt-3">5.1 Adesão</h3>
            <p>Entrada via pagamento único de <strong>R$ 9,90</strong> não reembolsável.</p>

            <h3 className="text-text-primary font-semibold mt-4">5.2 Comissões por tier</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>🥉 Bronze (0-9 clientes ativos): 60%</li>
              <li>🥈 Prata (10-24): 62,5%</li>
              <li>🥇 Ouro (25-49): 65%</li>
              <li>💎 Diamante (50-99): 67,5%</li>
              <li>👑 Lendário (100+): 70%</li>
            </ul>

            <h3 className="text-text-primary font-semibold mt-4">5.3 Estornos</h3>
            <p>Em caso de estorno ou chargeback, o valor da comissão é <strong>debitado</strong> da próxima cobrança ou diretamente do saldo do Revendedor (figura como <em>liable</em> nas regras de split Pagar.me).</p>

            <h3 className="text-text-primary font-semibold mt-4">5.4 Bônus</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Bônus Lendário</strong> (R$ 2.000): pago uma única vez ao Revendedor que atingir 100+ clientes ativos pela primeira vez.</li>
              <li><strong>Bônus Top 1 mensal</strong> (R$ 500): pago ao Revendedor com maior receita gerada no mês anterior.</li>
            </ul>
          </Section>

          <Section title="6. Propriedade Intelectual">
            <p>A extensão DSL e todos os códigos são propriedade exclusiva da ID SERVIÇOS DIGITAIS LTDA. É <strong>PROIBIDO</strong>:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Engenharia reversa do código</li>
              <li>Redistribuição não autorizada</li>
              <li>Modificação ou clonagem do produto</li>
              <li>Uso comercial fora do programa de revendas oficial</li>
            </ul>
            <p className="text-xs">Violações sujeitam às sanções da Lei 9.609/98 e Lei 9.610/98.</p>
          </Section>

          <Section title="7. Limitação de Uso">
            <p>A licença é <strong>pessoal e intransferível</strong>. Cada licença permite até <strong>3 (três) dispositivos simultâneos</strong>. Tentativas de burla acarretam suspensão imediata.</p>
          </Section>

          <Section title="8. Disponibilidade e Responsabilidade">
            <p>SLA de <strong>99% mensal</strong>. Interrupções de terceiros (Lovable, Supabase, Pagar.me) <strong>não geram direito a reembolso</strong>.</p>
            <p>A responsabilidade total fica limitada ao <strong>valor pago pelo Usuário no ciclo atual</strong>.</p>
          </Section>

          <Section title="9. Privacidade e LGPD">
            <p>O tratamento de dados segue nossa <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>, em conformidade com a Lei 13.709/2018 (LGPD).</p>
          </Section>

          <Section title="10. Alterações dos Termos">
            <p>A DSL pode alterar estes Termos com aviso prévio de <strong>30 dias</strong> por email. Uso continuado após o prazo implica aceite.</p>
          </Section>

          <Section title="11. Contato">
            <p>
              <strong>ID SERVIÇOS DIGITAIS LTDA</strong><br />
              CNPJ: 54.107.510/0001-91<br />
              Email: <a href="mailto:contato@devsemlimites.site" className="text-primary hover:underline">contato@devsemlimites.site</a><br />
              WhatsApp: +55 27 99266-0736
            </p>
          </Section>

        </article>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-display font-bold text-text-primary mt-6 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
