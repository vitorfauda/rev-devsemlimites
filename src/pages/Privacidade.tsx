import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function Privacidade() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="size-7 text-primary" />
          <h1 className="text-3xl font-display font-bold">Política de Privacidade</h1>
        </div>
        <p className="text-text-muted text-sm mb-6">Última atualização: 26/04/2026 · LGPD-compliant</p>

        <article className="prose prose-invert max-w-none space-y-6 text-text-muted">

          <Section title="1. Controlador de Dados">
            <p>
              <strong>ID SERVIÇOS DIGITAIS LTDA</strong><br />
              CNPJ: 54.107.510/0001-91<br />
              Email: <a href="mailto:contato@devsemlimites.site" className="text-primary hover:underline">contato@devsemlimites.site</a><br />
              Encarregado de Dados (DPO): contato@devsemlimites.site
            </p>
          </Section>

          <Section title="2. Dados Coletados">
            <h3 className="text-text-primary font-semibold mt-3">2.1 Dados de cadastro</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome completo</li>
              <li>Email</li>
              <li>WhatsApp</li>
              <li>CPF/CNPJ</li>
              <li>Endereço completo</li>
              <li>Data de nascimento (se PF)</li>
            </ul>
            <p className="text-xs">Base legal: Execução de contrato (Art. 7º, V LGPD)</p>

            <h3 className="text-text-primary font-semibold mt-4">2.2 Dados de pagamento</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tokens de cartão (NÃO armazenamos número completo — só os 4 últimos dígitos)</li>
              <li>Histórico de transações</li>
              <li>Chave PIX e dados bancários (apenas Revendedores)</li>
            </ul>
            <p className="text-xs">Processados por Pagar.me. Base legal: Execução de contrato.</p>

            <h3 className="text-text-primary font-semibold mt-4">2.3 Dados de uso</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP de acesso e User-Agent</li>
              <li>Logs de uso da extensão</li>
              <li>Métricas de venda (apenas Revendedores)</li>
            </ul>
            <p className="text-xs">Base legal: Legítimo interesse (segurança e prevenção de fraude)</p>
          </Section>

          <Section title="3. Finalidades do Tratamento">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-text-primary">Finalidade</th>
                  <th className="text-left py-2 text-text-primary">Base legal</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Processar pagamentos e gerar licenças</td><td>Execução de contrato</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Enviar comunicações transacionais</td><td>Execução de contrato</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Calcular comissões de Revendedores</td><td>Execução de contrato</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Detectar fraudes e abuso</td><td>Legítimo interesse</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Cumprir obrigações fiscais</td><td>Obrigação legal</td></tr>
                <tr><td className="py-2 pr-4">Marketing</td><td>Consentimento</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p>Compartilhamos dados estritamente necessários com operadores:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Pagar.me</strong> — processamento de pagamentos</li>
              <li><strong>Resend</strong> — envio de emails transacionais</li>
              <li><strong>Evolution API</strong> — envio de WhatsApp</li>
              <li><strong>Supabase</strong> — hospedagem e infraestrutura</li>
            </ul>
            <p className="font-bold text-text-primary mt-2">NÃO vendemos dados pessoais a terceiros.</p>
          </Section>

          <Section title="5. Retenção">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados cadastrais:</strong> Conta ativa + 5 anos pós-encerramento (obrigação fiscal)</li>
              <li><strong>Histórico de transações:</strong> 10 anos (CTN Art. 174)</li>
              <li><strong>Logs de uso:</strong> 6 meses</li>
              <li><strong>Comunicações:</strong> 12 meses</li>
              <li><strong>Backups criptografados:</strong> 90 dias</li>
            </ul>
          </Section>

          <Section title="6. Direitos do Titular (LGPD Art. 18)">
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar se tratamos seus dados</li>
              <li>Acessar, corrigir, anonimizar ou eliminar dados</li>
              <li>Solicitar portabilidade</li>
              <li>Revogar consentimento</li>
              <li>Excluir seus dados (sujeito a obrigações legais de retenção)</li>
            </ul>
            <p>Como exercer: envie email para <a href="mailto:contato@devsemlimites.site" className="text-primary hover:underline">contato@devsemlimites.site</a> com assunto <strong>"LGPD - [seu pedido]"</strong>. Respondemos em até 15 dias úteis.</p>
          </Section>

          <Section title="7. Segurança">
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>HTTPS</strong> obrigatório</li>
              <li>Senhas com hash <strong>bcrypt</strong></li>
              <li>Dados sensíveis com <strong>AES-256-GCM</strong></li>
              <li><strong>2FA</strong> disponível e obrigatório pra ações sensíveis</li>
              <li><strong>RLS</strong> (Row Level Security) no Supabase</li>
              <li><strong>Logs de auditoria</strong> em ações sensíveis</li>
              <li><strong>Backups criptografados</strong> diários</li>
            </ul>
            <p className="text-xs">Em caso de incidente, comunicamos titulares e ANPD em até 72h (LGPD Art. 48).</p>
          </Section>

          <Section title="8. Cookies">
            <p>Usamos cookies <strong>essenciais</strong> para autenticação. <strong>NÃO usamos cookies de tracking de terceiros</strong> (Google Analytics, Facebook Pixel, etc).</p>
          </Section>

          <Section title="9. Crianças e Adolescentes">
            <p>O serviço <strong>NÃO é direcionado a menores de 18 anos</strong>. Coleta inadvertida de dados de menor é eliminada imediatamente.</p>
          </Section>

          <Section title="10. Contato">
            <p>Dúvidas, reclamações ou solicitações:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:contato@devsemlimites.site" className="text-primary hover:underline">contato@devsemlimites.site</a></li>
              <li>WhatsApp: +55 27 99266-0736</li>
            </ul>
            <p>Em caso de não-resolução, contate a ANPD: <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer" className="text-primary hover:underline">gov.br/anpd</a></p>
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
