import { supabase } from '@/lib/supabase';

export interface KPIData {
  totalMaterials: number;
  totalInYard: number;
  totalQuantityInYard: number;
  openExceptions: number;
  agingOver30: number;
  agingOver90: number;
}

export interface InventoryByType {
  material_type: string;
  item_count: number;
  total_quantity: number;
}

export interface YardLocation {
  location_id: string;
  zone: string;
  row: string;
  rack: string;
  is_hold_area: boolean;
  capacity: number | null;
  items_stored: number;
  total_quantity: number;
}

export async function fetchKPIs(): Promise<KPIData> {
  // Total materials and in-yard count
  const { data: inventory } = await supabase
    .from('v_inventory_summary')
    .select('*');

  let totalMaterials = 0;
  let totalInYard = 0;
  let totalQuantityInYard = 0;

  for (const row of inventory ?? []) {
    totalMaterials += Number(row.item_count);
    if (row.status === 'in_yard') {
      totalInYard += Number(row.item_count);
      totalQuantityInYard += Number(row.total_quantity);
    }
  }

  // Open exceptions
  const { count: openExceptions } = await supabase
    .from('receiving_records')
    .select('id', { count: 'exact', head: true })
    .eq('has_exception', true)
    .eq('exception_resolved', false);

  // Aging items
  const { data: aging } = await supabase
    .from('v_aging_report')
    .select('days_in_yard');

  let agingOver30 = 0;
  let agingOver90 = 0;
  for (const row of aging ?? []) {
    if (Number(row.days_in_yard) > 90) agingOver90++;
    else if (Number(row.days_in_yard) > 30) agingOver30++;
  }

  return {
    totalMaterials,
    totalInYard,
    totalQuantityInYard,
    openExceptions: openExceptions ?? 0,
    agingOver30,
    agingOver90,
  };
}

export async function fetchInventoryByType(): Promise<InventoryByType[]> {
  const { data, error } = await supabase
    .from('v_inventory_summary')
    .select('*')
    .eq('status', 'in_yard')
    .order('item_count', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    material_type: r.material_type,
    item_count: Number(r.item_count),
    total_quantity: Number(r.total_quantity),
  }));
}

export async function fetchYardOverview(): Promise<YardLocation[]> {
  const { data, error } = await supabase
    .from('v_yard_overview')
    .select('*')
    .order('zone')
    .order('row')
    .order('rack');

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    location_id: r.location_id,
    zone: r.zone,
    row: r.row,
    rack: r.rack,
    is_hold_area: r.is_hold_area,
    capacity: r.capacity,
    items_stored: Number(r.items_stored),
    total_quantity: Number(r.total_quantity),
  }));
}
