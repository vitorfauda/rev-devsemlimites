import { useEffect, useRef, useState } from 'react';
import { X, QrCode, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useResellerWhatsApp } from '@/hooks/useResellerWhatsApp';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onClose: () => void;
  onConnected?: (phone: string | null) => void;
};

export function WhatsAppConnectModal({ open, onClose, onConnected }: Props) {
  const { status, phone, createInstance, refresh } = useResellerWhatsApp();
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollerRef = useRef<number | null>(null);

  // Quando abre, inicia geração do QR
  useEffect(() => {
    if (!open) {
      // limpa polling ao fechar
      if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
      setQr(null); setPairingCode(null);
      return;
    }
    generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Quando conecta, fecha modal + chama callback
  useEffect(() => {
    if (status === 'connected' && open) {
      if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
      toast.success('WhatsApp conectado!');
      onConnected?.(phone);
      setTimeout(onClose, 1200);
    }
  }, [status, open, phone, onConnected, onClose]);

  const generateQR = async () => {
    setGenerating(true);
    try {
      const data = await createInstance();
      setQr(data.qr_base64);
      setPairingCode(data.pairing_code);
      // inicia polling
      setPolling(true);
      pollerRef.current = window.setInterval(refresh, 3000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 grid place-items-center">
              <Smartphone size={16} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="font-medium">Conectar meu WhatsApp</div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Use seu próprio número</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 text-[var(--color-text-muted)]"><X size={16} /></button>
        </div>

        <div className="p-5">
          {status === 'connected' ? (
            <div className="text-center py-6">
              <div className="size-14 mx-auto rounded-full bg-[var(--color-primary)]/15 grid place-items-center mb-3">
                <CheckCircle2 size={26} className="text-[var(--color-primary)]" />
              </div>
              <div className="font-medium mb-1">Conectado!</div>
              <div className="text-xs text-[var(--color-text-muted)]">Número {phone || ''}</div>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
                Abra o WhatsApp no seu celular → <strong className="text-[var(--color-text)]">Configurações</strong> → <strong className="text-[var(--color-text)]">Aparelhos conectados</strong> → <strong className="text-[var(--color-text)]">Conectar um aparelho</strong> e escaneie o QR abaixo.
              </p>

              <div className="rounded-md bg-white p-4 grid place-items-center min-h-[260px]">
                {generating && !qr ? (
                  <div className="flex flex-col items-center gap-2 text-[var(--color-text-dim)]">
                    <RefreshCw size={28} className="animate-spin text-[var(--color-primary)]" />
                    <span className="text-xs">Gerando QR…</span>
                  </div>
                ) : qr ? (
                  <img
                    src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
                    alt="QR Code"
                    className="w-full max-w-[240px] h-auto"
                  />
                ) : (
                  <div className="text-[var(--color-text-dim)] flex flex-col items-center gap-2">
                    <QrCode size={28} />
                    <span className="text-xs">QR não disponível</span>
                  </div>
                )}
              </div>

              {pairingCode && (
                <div className="mt-3 text-center">
                  <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mb-1">ou código de pareamento</div>
                  <code className="text-lg font-mono tracking-widest text-[var(--color-text)]">{pairingCode}</code>
                </div>
              )}

              <div className="mt-4 text-center">
                <span className="text-xs text-[var(--color-text-muted)]">
                  {polling ? <>Aguardando você escanear… <span className="inline-block size-1.5 rounded-full bg-[var(--color-primary)] animate-pulse ml-1" /></> : 'Clique abaixo se o QR expirar'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <Button variant="secondary" onClick={generateQR} disabled={generating}>
                  <RefreshCw size={14} className={generating ? 'animate-spin' : ''} /> Gerar novo
                </Button>
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
