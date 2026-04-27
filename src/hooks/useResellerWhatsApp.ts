import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type WhatsAppStatus = 'not_configured' | 'pending' | 'connected' | 'disconnected' | 'unknown';

type WhatsAppState = {
  status: WhatsAppStatus;
  phone: string | null;
  loading: boolean;
};

export function useResellerWhatsApp() {
  const [state, setState] = useState<WhatsAppState>({ status: 'unknown', phone: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reseller-whatsapp-status');
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'falha ao buscar status');
      setState({ status: data.status, phone: data.phone || null, loading: false });
      return data.status as WhatsAppStatus;
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      return 'unknown' as WhatsAppStatus;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Cria nova instância e devolve { qr_base64, status } */
  const createInstance = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('reseller-whatsapp-create');
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || 'falha ao criar instância');
    return data as { ok: true; instance_name: string; qr_base64: string | null; pairing_code: string | null; state: string; status: WhatsAppStatus };
  }, []);

  /** Desconecta + apaga */
  const disconnect = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('reseller-whatsapp-disconnect');
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || 'falha ao desconectar');
    setState({ status: 'not_configured', phone: null, loading: false });
    return true;
  }, []);

  return { ...state, refresh, createInstance, disconnect };
}
