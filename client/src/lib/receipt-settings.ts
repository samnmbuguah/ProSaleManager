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

export interface ReceiptTemplate {
  id: string;
  name: string;
  settings: ReceiptSettings;
}

interface ReceiptSettingsStore {
  settings: ReceiptSettings;
  templates: ReceiptTemplate[];
  activeTemplateId: string | null;
  updateSettings: (settings: Partial<ReceiptSettings>) => void;
  saveTemplate: (name: string) => void;
  deleteTemplate: (id: string) => void;
  loadTemplate: (id: string) => void;
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
      templates: [],
      activeTemplateId: null,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      saveTemplate: (name) =>
        set((state) => {
          const id = crypto.randomUUID();
          const newTemplate = {
            id,
            name,
            settings: { ...state.settings },
          };
          return {
            templates: [...state.templates, newTemplate],
            activeTemplateId: id,
          };
        }),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          activeTemplateId: state.activeTemplateId === id ? null : state.activeTemplateId,
        })),
      loadTemplate: (id) =>
        set((state) => {
          const template = state.templates.find((t) => t.id === id);
          if (!template) return state;
          return {
            settings: { ...template.settings },
            activeTemplateId: id,
          };
        }),
    }),
    {
      name: 'receipt-settings',
    }
  )
);
