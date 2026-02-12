import { supabase } from '@/lib/supabase';

export interface ActivityItem {
  id: string;
  type: 'receiving' | 'transfer' | 'issue';
  description: string;
  detail: string;
  created_at: string;
}

export async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const items: ActivityItem[] = [];

  // Fetch recent receiving records
  const { data: receivings } = await supabase
    .from('receiving_records')
    .select('id, material_type, qty, status, created_at')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  for (const r of receivings ?? []) {
    items.push({
      id: `recv-${r.id}`,
      type: 'receiving',
      description: `Received ${r.material_type}`,
      detail: `Qty: ${r.qty} — ${r.status}`,
      created_at: r.created_at,
    });
  }

  // Fetch recent transfers
  const { data: transfers } = await supabase
    .from('material_movements')
    .select(`
      id, reason, created_at,
      materials ( material_type ),
      to_location:locations!material_movements_to_location_id_fkey ( zone, row, rack )
    `)
    .eq('moved_by', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  for (const t of transfers ?? []) {
    const m = t as any;
    const toLoc = m.to_location;
    items.push({
      id: `move-${t.id}`,
      type: 'transfer',
      description: `Transferred ${m.materials?.material_type ?? 'material'}`,
      detail: toLoc ? `To ${toLoc.zone} - Row ${toLoc.row}, Rack ${toLoc.rack}` : 'Moved',
      created_at: t.created_at,
    });
  }

  // Fetch recent issues
  const { data: issues } = await supabase
    .from('material_issues')
    .select(`
      id, job_number, quantity_issued, created_at,
      materials ( material_type )
    `)
    .eq('issued_by', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  for (const i of issues ?? []) {
    const m = i as any;
    items.push({
      id: `issue-${i.id}`,
      type: 'issue',
      description: `Issued ${m.materials?.material_type ?? 'material'}`,
      detail: `Qty: ${i.quantity_issued} to Job ${i.job_number}`,
      created_at: i.created_at,
    });
  }

  // Sort all by date, most recent first
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items.slice(0, 50);
}
