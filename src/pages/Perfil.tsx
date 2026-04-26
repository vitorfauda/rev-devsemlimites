import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, Copy, LogOut, User, Shield, Banknote, Link2 } from 'lucide-react';
import { copyToClipboard, maskCPF, maskPhone } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button, Card, PageHeader, Section, inputClass } from '@/components/ui';

export default function Perfil() {
  const { reseller, refreshReseller, signOut } = useAuth();
  const nav = useNavigate();
  const [section, setSection] = useState('dados');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: reseller?.name || '',
    whatsapp: maskPhone(reseller?.whatsapp || ''),
    pix_key: reseller?.pix_key || '',
  });

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  const saveDados = async () => {
    if (!reseller) return;
    setSaving(true);
    const { error } = await supabase
      .from('resellers')
      .update({ name: form.name, whatsapp: form.whatsapp.replace(/\D/g, ''), pix_key: form.pix_key || null })
      .eq('id', reseller.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Dados atualizados');
    refreshReseller();
  };

  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) {
      toast.error('Senhas não coincidem');
      return;
    }
    if (pwd.next.length < 8) {
      toast.error('Mínimo 8 caracteres');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Senha alterada');
    setPwd({ current: '', next: '', confirm: '' });
  };

  const refLink = `https://rev.devsemlimites.site/cadastrar?ref=${reseller?.ref_code || ''}`;

  const copyRef = async () => {
    await copyToClipboard(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Link copiado');
  };

  const handleSignOut = async () => {
    await signOut();
    nav('/');
  };

  if (!reseller) return null;

  const sections = [
    { id: 'dados', label: 'Dados pessoais', icon: User },
    { id: 'seguranca', label: 'Senha', icon: Shield },
    { id: 'recebimentos', label: 'Chave PIX', icon: Banknote },
    { id: 'referral', label: 'Referral', icon: Link2 },
  ];

  return (
    <Section>
      <PageHeader title="Perfil" description="Seus dados, senha e link de referral" />

      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-all ' +
                  (active
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/50')
                }
              >
                <Icon size={14} className={active ? 'text-[var(--color-primary)]' : ''} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <Card className="p-6">
          {section === 'dados' && (
            <div className="space-y-4">
              <div className="text-sm font-medium mb-1">Dados pessoais</div>
              <Field label="Nome">
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="WhatsApp">
                <input
                  className={inputClass}
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })}
                  maxLength={15}
                />
              </Field>
              <Field label="Email">
                <input className={inputClass + ' opacity-60'} value={reseller.email} disabled />
              </Field>
              <Field label="CPF">
                <input className={inputClass + ' opacity-60'} value={maskCPF(reseller.cpf)} disabled />
              </Field>
              <Button onClick={saveDados} disabled={saving} className="mt-2">
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          )}

          {section === 'seguranca' && (
            <div className="space-y-4">
              <div className="text-sm font-medium mb-1">Trocar senha</div>
              <Field label="Nova senha">
                <input type="password" className={inputClass} value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
              </Field>
              <Field label="Confirmar nova senha">
                <input type="password" className={inputClass} value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </Field>
              <Button onClick={changePwd} disabled={saving} className="mt-2">
                {saving ? 'Alterando…' : 'Alterar senha'}
              </Button>
            </div>
          )}

          {section === 'recebimentos' && (
            <div className="space-y-4">
              <div className="text-sm font-medium">Chave PIX</div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Usada para futuros repasses ou splits automáticos.
              </p>
              <Field label="Chave PIX">
                <input
                  className={inputClass}
                  value={form.pix_key}
                  onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
                  placeholder="CPF, email, telefone ou chave aleatória"
                />
              </Field>
              <Button onClick={saveDados} disabled={saving} className="mt-2">
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          )}

          {section === 'referral' && (
            <div className="space-y-4">
              <div className="text-sm font-medium">Seu link de referral</div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Compartilhe esse link. Quem se cadastrar por ele entra como indicação sua.
              </p>
              <div className="flex gap-2">
                <input readOnly value={refLink} className={inputClass + ' font-mono text-xs'} />
                <Button onClick={copyRef} variant="secondary" className="shrink-0">
                  {copied ? <Check size={13} className="text-[var(--color-primary)]" /> : <Copy size={13} />}
                </Button>
              </div>
              <div className="mt-2 p-3 rounded-md bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 text-sm">
                Seu código:{' '}
                <span className="font-mono font-medium text-[var(--color-primary)]">{reseller.ref_code}</span>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
            >
              <LogOut size={13} /> Sair da conta
            </button>
          </div>
        </Card>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--color-text-muted)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
