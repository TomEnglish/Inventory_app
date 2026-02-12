import { supabase } from '@/lib/supabase';
import { compressPhoto } from '@/lib/utils/compressPhoto';
import { logAction } from './auditLog';
import type { PhotoEntry } from '@/stores/receivingStore';
import type {
  MaterialStepData,
  POStepData,
  InspectionStepData,
  LocationStepData,
  DecisionStepData,
} from '@/lib/utils/validation';

// Look up an existing QR code or create a new one
export async function lookupOrCreateQRCode(codeValue: string) {
  // Check if QR code exists
  const { data: existing } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('code_value', codeValue)
    .single();

  if (existing) {
    return { id: existing.id, isNew: false };
  }

  // Create new QR code
  const { data: created, error } = await supabase
    .from('qr_codes')
    .insert({ code_value: codeValue, entity_type: 'item' })
    .select()
    .single();

  if (error) throw new Error(`Failed to create QR code: ${error.message}`);
  return { id: created.id, isNew: true };
}

// Upload a photo to Supabase Storage and return the storage path
async function uploadPhoto(photo: PhotoEntry, receivingRecordId: string) {
  const fileName = `${receivingRecordId}/${Date.now()}_${photo.photo_type}.jpg`;

  const compressedUri = await compressPhoto(photo.uri);
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('inspection-photos')
    .upload(fileName, blob, { contentType: 'image/jpeg' });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return fileName;
}

// Submit the full receiving record
export async function submitReceivingRecord({
  qrCodeId,
  material,
  po,
  inspection,
  photos,
  location,
  decision,
  userId,
}: {
  qrCodeId: string;
  material: MaterialStepData;
  po: POStepData;
  inspection: InspectionStepData;
  photos: PhotoEntry[];
  location: LocationStepData;
  decision: DecisionStepData;
  userId: string;
}) {
  // Insert receiving record
  const { data: record, error: recordError } = await supabase
    .from('receiving_records')
    .insert({
      qr_code_id: qrCodeId,
      status: decision.status,
      material_type: material.material_type,
      size: material.size ?? null,
      grade: material.grade ?? null,
      qty: material.qty,
      weight: material.weight ?? null,
      description: material.description ?? null,
      spec: material.spec ?? null,
      vendor: po.vendor ?? null,
      po_number: po.po_number ?? null,
      delivery_ticket: po.delivery_ticket ?? null,
      carrier: po.carrier ?? null,
      condition: inspection.condition,
      damage_notes: inspection.damage_notes ?? null,
      inspection_pass: inspection.inspection_pass,
      has_exception: decision.has_exception,
      exception_type: decision.exception_type ?? null,
      exception_resolved: false,
      location_id: location.location_id,
      created_by: userId,
    })
    .select()
    .single();

  if (recordError) throw new Error(`Failed to save record: ${recordError.message}`);

  // Upload photos and save references
  for (const photo of photos) {
    const storagePath = await uploadPhoto(photo, record.id);
    const { error: photoError } = await supabase
      .from('inspection_photos')
      .insert({
        receiving_record_id: record.id,
        storage_path: storagePath,
        photo_type: photo.photo_type,
      });

    if (photoError) {
      console.warn('Failed to save photo reference:', photoError.message);
    }
  }

  // Link QR code to this receiving record
  await supabase
    .from('qr_codes')
    .update({ entity_id: record.id })
    .eq('id', qrCodeId);

  // Auto-create material record if accepted
  if (decision.status === 'accepted' || decision.status === 'partially_accepted') {
    await supabase.from('materials').insert({
      receiving_record_id: record.id,
      qr_code_id: qrCodeId,
      material_type: material.material_type,
      size: material.size ?? null,
      grade: material.grade ?? null,
      qty: material.qty,
      current_quantity: material.qty,
      weight: material.weight ?? null,
      spec: material.spec ?? null,
      location_id: location.location_id,
      status: 'in_yard',
    });
  }

  // Audit log
  logAction(userId, 'receiving_created', 'receiving_record', record.id, {
    material_type: material.material_type,
    qty: material.qty,
    status: decision.status,
    has_exception: decision.has_exception,
  });

  return record;
}
