import { Alert } from 'react-native';
import { getQueue, removeFromQueue, type QueueItem } from './offlineQueue';
import { lookupOrCreateQRCode, submitReceivingRecord } from '../api/receiving';
import { transferMaterial, issueMaterial } from '../api/materials';
import { createShipment } from '../api/shipments';
import { useNetworkStore } from './networkStore';

let syncing = false;

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  if (syncing) return { processed: 0, failed: 0 };
  syncing = true;

  let processed = 0;
  let failed = 0;

  try {
    const queue = await getQueue();
    for (const item of queue) {
      try {
        await processItem(item);
        await removeFromQueue(item.id);
        processed++;
      } catch {
        failed++;
        // Leave failed items in queue for next retry
        break; // Stop processing — items may depend on order
      }
    }
  } finally {
    syncing = false;
  }

  if (processed > 0) {
    Alert.alert('Sync Complete', `${processed} queued action${processed > 1 ? 's' : ''} synced successfully.`);
  }

  return { processed, failed };
}

async function processItem(item: QueueItem): Promise<void> {
  const { action } = item;

  switch (action.type) {
    case 'receiving': {
      const r = action.payload;
      const qr = await lookupOrCreateQRCode(r.qrCodeValue);
      await submitReceivingRecord({
        qrCodeId: qr.id,
        material: r.material,
        po: r.po,
        inspection: r.inspection,
        photos: r.photos,
        location: r.location,
        decision: r.decision,
        userId: r.userId,
      });
      break;
    }
    case 'transfer': {
      const t = action.payload;
      await transferMaterial(t.materialId, t.fromLocationId, t.toLocationId, t.movedBy, t.reason);
      break;
    }
    case 'issue': {
      const i = action.payload;
      await issueMaterial(i.materialId, i.jobNumber, i.quantity, i.issuedBy, i.workOrder);
      break;
    }
    case 'shipment': {
      const s = action.payload;
      await createShipment(s.materialId, s.destination, s.quantity, s.carrier, s.trackingNumber);
      break;
    }
  }
}

// Subscribe to network changes and auto-sync when coming back online
export function startAutoSync() {
  return useNetworkStore.subscribe((state, prev) => {
    if (state.isOnline && !prev.isOnline) {
      // Just came back online — process the queue
      processQueue();
    }
  });
}
