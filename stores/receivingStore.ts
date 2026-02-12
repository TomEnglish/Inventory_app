import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MaterialStepData,
  POStepData,
  InspectionStepData,
  PhotoStepData,
  LocationStepData,
  DecisionStepData,
} from '@/lib/utils/validation';

export interface PhotoEntry {
  uri: string;
  photo_type: 'damage' | 'general' | 'delivery_ticket';
}

interface ReceivingState {
  // Current wizard state
  step: number;
  qrCodeValue: string;
  qrCodeId: string | null;

  // Step data
  material: MaterialStepData;
  po: POStepData;
  inspection: InspectionStepData;
  photos: PhotoEntry[];
  location: LocationStepData;
  decision: DecisionStepData;

  // Actions
  setStep: (step: number) => void;
  setQRCode: (codeValue: string, id: string | null) => void;
  setMaterial: (data: MaterialStepData) => void;
  setPO: (data: POStepData) => void;
  setInspection: (data: InspectionStepData) => void;
  addPhoto: (photo: PhotoEntry) => void;
  removePhoto: (index: number) => void;
  setLocation: (data: LocationStepData) => void;
  setDecision: (data: DecisionStepData) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  qrCodeValue: '',
  qrCodeId: null as string | null,
  material: {
    material_type: '',
    qty: 1,
  } as MaterialStepData,
  po: {} as POStepData,
  inspection: {
    condition: 'good' as const,
    inspection_pass: true,
  } as InspectionStepData,
  photos: [] as PhotoEntry[],
  location: {
    location_id: '',
  } as LocationStepData,
  decision: {
    status: 'accepted' as const,
    has_exception: false,
  } as DecisionStepData,
};

export const useReceivingStore = create<ReceivingState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),
      setQRCode: (qrCodeValue, qrCodeId) => set({ qrCodeValue, qrCodeId }),
      setMaterial: (material) => set({ material }),
      setPO: (po) => set({ po }),
      setInspection: (inspection) => set({ inspection }),
      addPhoto: (photo) =>
        set((state) => ({ photos: [...state.photos, photo] })),
      removePhoto: (index) =>
        set((state) => ({
          photos: state.photos.filter((_, i) => i !== index),
        })),
      setLocation: (location) => set({ location }),
      setDecision: (decision) => set({ decision }),
      reset: () => set(initialState),
    }),
    {
      name: 'receiving-wizard',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
