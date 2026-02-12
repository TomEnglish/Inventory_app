import { supabase } from '@/lib/supabase';
import { logAction } from './auditLog';

export interface MaterialWithLocation {
  id: string;
  material_type: string;
  size: string | null;
  grade: string | null;
  qty: number;
  current_quantity: number;
  weight: number | null;
  spec: string | null;
  status: string;
  qr_code_id: string;
  location_id: string | null;
  created_at: string;
  qr_code_value: string | null;
  location_zone: string | null;
  location_row: string | null;
  location_rack: string | null;
}

export async function fetchMaterials(filters?: {
  status?: string;
  material_type?: string;
  search?: string;
}) {
  let query = supabase
    .from('materials')
    .select(`
      *,
      qr_codes ( code_value ),
      locations ( zone, row, rack )
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.material_type) {
    query = query.eq('material_type', filters.material_type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let results = (data ?? []).map((m: any) => ({
    id: m.id,
    material_type: m.material_type,
    size: m.size,
    grade: m.grade,
    qty: m.qty,
    current_quantity: m.current_quantity,
    weight: m.weight,
    spec: m.spec,
    status: m.status,
    qr_code_id: m.qr_code_id,
    location_id: m.location_id,
    created_at: m.created_at,
    qr_code_value: m.qr_codes?.code_value ?? null,
    location_zone: m.locations?.zone ?? null,
    location_row: m.locations?.row ?? null,
    location_rack: m.locations?.rack ?? null,
  })) as MaterialWithLocation[];

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(
      (m) =>
        m.material_type.toLowerCase().includes(s) ||
        m.qr_code_value?.toLowerCase().includes(s) ||
        m.grade?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function fetchMaterialById(id: string) {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      qr_codes ( code_value ),
      locations ( zone, row, rack )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const m = data as any;
  return {
    id: m.id,
    material_type: m.material_type,
    size: m.size,
    grade: m.grade,
    qty: m.qty,
    current_quantity: m.current_quantity,
    weight: m.weight,
    spec: m.spec,
    status: m.status,
    qr_code_id: m.qr_code_id,
    location_id: m.location_id,
    created_at: m.created_at,
    qr_code_value: m.qr_codes?.code_value ?? null,
    location_zone: m.locations?.zone ?? null,
    location_row: m.locations?.row ?? null,
    location_rack: m.locations?.rack ?? null,
  } as MaterialWithLocation;
}

export async function transferMaterial(
  materialId: string,
  fromLocationId: string | null,
  toLocationId: string,
  movedBy: string,
  reason?: string
) {
  // Update material location
  const { error: updateError } = await supabase
    .from('materials')
    .update({ location_id: toLocationId })
    .eq('id', materialId);

  if (updateError) throw new Error(updateError.message);

  // Record the movement
  const { error: moveError } = await supabase
    .from('material_movements')
    .insert({
      material_id: materialId,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      moved_by: movedBy,
      reason: reason || null,
    });

  if (moveError) throw new Error(moveError.message);

  logAction(movedBy, 'material_transferred', 'material', materialId, {
    from: fromLocationId,
    to: toLocationId,
    reason,
  });
}

export async function issueMaterial(
  materialId: string,
  jobNumber: string,
  quantityIssued: number,
  issuedBy: string,
  workOrder?: string
) {
  // Get current material
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('current_quantity')
    .eq('id', materialId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newQty = material.current_quantity - quantityIssued;
  if (newQty < 0) throw new Error('Cannot issue more than available quantity');

  // Update quantity and status
  const { error: updateError } = await supabase
    .from('materials')
    .update({
      current_quantity: newQty,
      status: newQty === 0 ? 'depleted' : 'in_yard',
    })
    .eq('id', materialId);

  if (updateError) throw new Error(updateError.message);

  // Record the issue
  const { error: issueError } = await supabase
    .from('material_issues')
    .insert({
      material_id: materialId,
      job_number: jobNumber,
      work_order: workOrder || null,
      quantity_issued: quantityIssued,
      issued_by: issuedBy,
    });

  if (issueError) throw new Error(issueError.message);

  logAction(issuedBy, 'material_issued', 'material', materialId, {
    job_number: jobNumber,
    quantity: quantityIssued,
  });
}
