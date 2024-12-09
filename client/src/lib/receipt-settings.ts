import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReceiptSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  thankYouMessage: string;
  showLogo: boolean;
  fontSize: 'small' | 'medium' | 'large';
  paperSize: 'standard' | 'thermal';
}

interface ReceiptSettingsStore {
  settings: ReceiptSettings;
  updateSettings: (settings: Partial<ReceiptSettings>) => void;
}

const defaultSettings: ReceiptSettings = {
  businessName: 'My Business',
  address: '',
  phone: '',
  email: '',
  website: '',
  thankYouMessage: 'Thank you for your business!',
  showLogo: true,
  fontSize: 'medium',
  paperSize: 'thermal',
};

export const useReceiptSettings = create<ReceiptSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'receipt-settings',
    }
  )
);
