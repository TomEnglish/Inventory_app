import { supabase } from '@/lib/supabase';

export interface ActivityItem {
  id: string;
  type: 'receiving' | 'transfer' | 'issue';
  description: string;
  detail: string;
  created_at: string;
}

export async function fetchRecentActivity(userId?: string): Promise<ActivityItem[]> {
  const items: ActivityItem[] = [];

  // Fetch recent receiving records
  let recvQuery = supabase
    .from('receiving_records')
    .select('id, material_type, qty, status, created_at, users!receiving_records_created_by_fkey ( full_name )')
    .order('created_at', { ascending: false })
    .limit(20);
  if (userId) recvQuery = recvQuery.eq('created_by', userId);
  const { data: receivings } = await recvQuery;

  for (const r of receivings ?? []) {
    const rec = r as any;
    const who = rec.users?.full_name;
    items.push({
      id: `recv-${r.id}`,
      type: 'receiving',
      description: `Received ${r.material_type}`,
      detail: `Qty: ${r.qty} — ${r.status}${who ? ` — ${who}` : ''}`,
      created_at: r.created_at,
    });
  }

  // Fetch recent transfers
  let moveQuery = supabase
    .from('material_movements')
    .select(`
      id, reason, created_at,
      materials ( material_type ),
      to_location:locations!material_movements_to_location_id_fkey ( zone, row, rack ),
      users!material_movements_moved_by_fkey ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(20);
  if (userId) moveQuery = moveQuery.eq('moved_by', userId);
  const { data: transfers } = await moveQuery;

  for (const t of transfers ?? []) {
    const m = t as any;
    const toLoc = m.to_location;
    const who = m.users?.full_name;
    items.push({
      id: `move-${t.id}`,
      type: 'transfer',
      description: `Transferred ${m.materials?.material_type ?? 'material'}`,
      detail: (toLoc ? `To ${toLoc.zone} - Row ${toLoc.row}, Rack ${toLoc.rack}` : 'Moved') + (who ? ` — ${who}` : ''),
      created_at: t.created_at,
    });
  }

  // Fetch recent issues
  let issueQuery = supabase
    .from('material_issues')
    .select(`
      id, job_number, quantity_issued, created_at,
      materials ( material_type ),
      users!material_issues_issued_by_fkey ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(20);
  if (userId) issueQuery = issueQuery.eq('issued_by', userId);
  const { data: issues } = await issueQuery;

  for (const i of issues ?? []) {
    const m = i as any;
    const who = m.users?.full_name;
    items.push({
      id: `issue-${i.id}`,
      type: 'issue',
      description: `Issued ${m.materials?.material_type ?? 'material'}`,
      detail: `Qty: ${i.quantity_issued} to Job ${i.job_number}${who ? ` — ${who}` : ''}`,
      created_at: i.created_at,
    });
  }

  // Sort all by date, most recent first
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items.slice(0, 50);
}
