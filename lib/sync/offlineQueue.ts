import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

export type QueueAction =
  | { type: 'receiving'; payload: any }
  | { type: 'transfer'; payload: { materialId: string; fromLocationId: string | null; toLocationId: string; movedBy: string; reason: string } }
  | { type: 'issue'; payload: { materialId: string; jobNumber: string; quantity: number; issuedBy: string; workOrder?: string } }
  | { type: 'shipment'; payload: { materialId: string; destination: string; quantity: number; carrier?: string; trackingNumber?: string } };

export interface QueueItem {
  id: string;
  action: QueueAction;
  createdAt: string;
}

export async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToQueue(action: QueueAction): Promise<void> {
  const queue = await getQueue();
  const item: QueueItem = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    action,
    createdAt: new Date().toISOString(),
  };
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
