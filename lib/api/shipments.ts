import { supabase } from '@/lib/supabase';
import { logAction } from './auditLog';

export interface ShipmentRecord {
  id: string;
  destination: string;
  carrier: string | null;
  tracking_number: string | null;
  quantity_shipped: number;
  created_at: string;
}

export async function createShipment(
  materialId: string,
  destination: string,
  quantityShipped: number,
  carrier?: string,
  trackingNumber?: string
) {
  // Get current material
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('current_quantity')
    .eq('id', materialId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newQty = material.current_quantity - quantityShipped;
  if (newQty < 0) throw new Error('Cannot ship more than available quantity');

  // Determine new status
  const newStatus = newQty === 0 ? 'shipped' : 'in_yard';

  // Update material
  const { error: updateError } = await supabase
    .from('materials')
    .update({
      current_quantity: newQty,
      status: newStatus,
    })
    .eq('id', materialId);

  if (updateError) throw new Error(updateError.message);

  // Create shipment record
  const { error: shipError } = await supabase
    .from('shipments_out')
    .insert({
      material_id: materialId,
      destination,
      carrier: carrier || null,
      tracking_number: trackingNumber || null,
      quantity_shipped: quantityShipped,
    });

  if (shipError) throw new Error(shipError.message);

  logAction(materialId, 'shipment_created', 'material', materialId, {
    destination,
    quantity: quantityShipped,
    carrier,
  });
}

export async function fetchShipmentHistory(materialId: string): Promise<ShipmentRecord[]> {
  const { data, error } = await supabase
    .from('shipments_out')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ShipmentRecord[];
}
