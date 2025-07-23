import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStoreContext } from '@/contexts/StoreContext'
import { api } from './api'

export interface ReceiptSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  thankYouMessage: string;
  showLogo: boolean;
}

const defaultSettings: ReceiptSettings = {
  businessName: 'My Business',
  address: '',
  phone: '',
  email: '',
  website: '',
  thankYouMessage: 'Thank you for your business!',
  showLogo: true,
}

export function useReceiptSettingsApi() {
  const { currentStore } = useStoreContext()
  const queryClient = useQueryClient()
  const storeId = currentStore?.id

  // Fetch receipt settings for the current store
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ReceiptSettings>({
    queryKey: ['receipt-settings', storeId],
    queryFn: async () => {
      if (!storeId) return defaultSettings
      try {
        const res = await api.get(`/stores/${storeId}/receipt-settings`)
        // Map backend keys to frontend keys if needed
        return {
          businessName: res.data.business_name,
          address: res.data.address,
          phone: res.data.phone,
          email: res.data.email,
          website: res.data.website,
          thankYouMessage: res.data.thank_you_message,
          showLogo: res.data.show_logo,
        }
      } catch (err: any) {
        // If 404, return default settings
        if (err?.status === 404 || err?.response?.status === 404) {
          return defaultSettings
        }
        throw err
      }
    },
    enabled: !!storeId,
  })

  // Update receipt settings
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<ReceiptSettings>) => {
      if (!storeId) throw new Error('No store selected')
      const payload = {
        business_name: newSettings.businessName,
        address: newSettings.address,
        phone: newSettings.phone,
        email: newSettings.email,
        website: newSettings.website,
        thank_you_message: newSettings.thankYouMessage,
        show_logo: newSettings.showLogo,
      }
      try {
        return await api.put(`/stores/${storeId}/receipt-settings`, payload)
      } catch (err: any) {
        // If 404, try to create
        if (err?.status === 404 || err?.response?.status === 404) {
          return api.post(`/stores/${storeId}/receipt-settings`, payload)
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-settings', storeId] })
    }
  })

  return {
    settings: settings || defaultSettings,
    isLoading,
    isError,
    error,
    updateSettings: mutation.mutate,
    updateStatus: mutation.status,
    refetch,
  }
}
