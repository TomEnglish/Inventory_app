import { supabase } from '@/lib/supabase';

export interface QRCodeRecord {
  id: string;
  code_value: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

function generateCode(): string {
  // Generate a short unique code: QR- + 8 random hex chars
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `QR-${hex.toUpperCase()}`;
}

export async function fetchQRCodes(): Promise<QRCodeRecord[]> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as QRCodeRecord[];
}

export async function batchCreateQRCodes(count: number): Promise<QRCodeRecord[]> {
  const rows = Array.from({ length: count }, () => ({
    code_value: generateCode(),
    entity_type: 'item',
  }));

  const { data, error } = await supabase
    .from('qr_codes')
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return (data ?? []) as QRCodeRecord[];
}

export async function fetchQRCodeDetail(id: string) {
  const { data: qr, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  // If linked to a material, fetch that too
  let material = null;
  if (qr.entity_id) {
    const { data: mat } = await supabase
      .from('materials')
      .select('*, locations(*)')
      .eq('id', qr.entity_id)
      .single();
    material = mat;
  }

  return { qr: qr as QRCodeRecord, material };
}
