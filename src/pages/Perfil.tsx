import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Check, Copy, LogOut, User, Shield, Banknote, Link2 } from 'lucide-react';
import { copyToClipboard, maskCPF, maskPhone } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
    const { error } = await supabase.from('resellers').update({
      name: form.name,
      whatsapp: form.whatsapp.replace(/\D/g, ''),
      pix_key: form.pix_key || null,
    }).eq('id', reseller.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Dados atualizados');
    refreshReseller();
  };

  const changePwd = async () => {
    if (pwd.next !== pwd.confirm) { toast.error('Senhas não coincidem'); return; }
    if (pwd.next.length < 8) { toast.error('Mínimo 8 caracteres'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Senha alterada');
    setPwd({ current: '', next: '', confirm: '' });
  };

  const refLink = `https://rev.devsemlimites.site/cadastrar?ref=${reseller?.ref_code || ''}`;

  const copyRef = async () => {
    await copyToClipboard(refLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Link copiado!');
  };

  const handleSignOut = async () => { await signOut(); nav('/'); };

  const sections = [
    { id: 'dados', label: 'Dados pessoais', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'recebimentos', label: 'Recebimentos', icon: Banknote },
    { id: 'referral', label: 'Link de referral', icon: Link2 },
  ];

  if (!reseller) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
      <h1 className="text-4xl font-display font-bold mb-8">Perfil</h1>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="flex md:flex-col gap-1 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                section === s.id ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-white/5'
              }`}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </aside>

        <div className="holo-card p-6">
          {section === 'dados' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Dados pessoais</h2>
              <Field label="Nome"><input className="input-dsl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="WhatsApp"><input className="input-dsl" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} maxLength={15} /></Field>
              <Field label="Email"><input className="input-dsl" value={reseller.email} disabled /></Field>
              <Field label="CPF"><input className="input-dsl" value={maskCPF(reseller.cpf)} disabled /></Field>
              <button onClick={saveDados} disabled={saving} className="cta-neon mt-2"><span className="relative z-10">{saving ? 'Salvando...' : 'Salvar'}</span></button>
            </div>
          )}

          {section === 'seguranca' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Trocar senha</h2>
              <Field label="Nova senha"><input type="password" className="input-dsl" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} /></Field>
              <Field label="Confirmar nova senha"><input type="password" className="input-dsl" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
              <button onClick={changePwd} disabled={saving} className="cta-neon mt-2"><span className="relative z-10">{saving ? 'Alterando...' : 'Alterar senha'}</span></button>
            </div>
          )}

          {section === 'recebimentos' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Chave PIX</h2>
              <p className="text-sm text-text-muted mb-4">Usada para futuros repasses/splits automáticos.</p>
              <Field label="Chave PIX"><input className="input-dsl" value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="CPF, email, telefone ou chave aleatória" /></Field>
              <button onClick={saveDados} disabled={saving} className="cta-neon mt-2"><span className="relative z-10">{saving ? 'Salvando...' : 'Salvar'}</span></button>
            </div>
          )}

          {section === 'referral' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Seu link de referral</h2>
              <p className="text-sm text-text-muted mb-4">Compartilhe esse link. Quem se cadastrar por ele entra como indicação sua.</p>
              <div className="flex gap-2">
                <input readOnly value={refLink} className="input-dsl font-mono text-xs" />
                <button onClick={copyRef} className="cta-ghost !px-4 shrink-0">{copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}</button>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                Seu código: <span className="font-mono font-bold text-primary">{reseller.ref_code}</span>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-text-muted mb-2">{label}</label>
      {children}
    </div>
  );
}
