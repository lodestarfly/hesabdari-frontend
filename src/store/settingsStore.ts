import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  companyName: string
  logo: string | null
  phone: string
  email: string
  address: string
  taxPercent: number
  setCompanyName: (v: string) => void
  setLogo: (v: string | null) => void
  setPhone: (v: string) => void
  setEmail: (v: string) => void
  setAddress: (v: string) => void
  setTaxPercent: (v: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      companyName: 'سیستم حسابداری حرفه‌ای',
      logo: null,
      phone: '',
      email: '',
      address: '',
      taxPercent: 9,
      setCompanyName: (v) => set({ companyName: v }),
      setLogo: (v) => set({ logo: v }),
      setPhone: (v) => set({ phone: v }),
      setEmail: (v) => set({ email: v }),
      setAddress: (v) => set({ address: v }),
      setTaxPercent: (v) => set({ taxPercent: v }),
    }),
    { name: 'accounting-company-settings' }
  )
)
