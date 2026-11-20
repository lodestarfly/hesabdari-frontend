import { customerService } from '@/services/customerService'
import { invoiceService } from '@/services/invoiceService'
import { productService } from '@/services/productService'
import { supplierService } from '@/services/supplierService'
import { useSettingsStore } from '@/store/settingsStore'
import { Invoice } from '@/types/invoice'

import { printInvoice } from './printInvoice'

/**
 * آماده‌سازی و چاپ فاکتور با اطلاعات کامل:
 * - دریافت آیتم‌ها (اگر در لیست نباشند)
 * - دریافت اطلاعات کامل مشتری / تامین‌کننده
 * - دریافت واحد کالاها
 * - اعمال لوگو و مشخصات شرکت از تنظیمات
 */
export async function printInvoiceFull(invoice: Invoice): Promise<boolean> {
  // 1) اطمینان از وجود آیتم‌ها
  let full = invoice
  if (!invoice.items || invoice.items.length === 0) {
    full = await invoiceService.getInvoiceById(invoice.id)
  }

  // 2) اطلاعات کامل طرف حساب
  let party: any = null
  try {
    if (full.invoice_type === 'purchase' && full.supplier_id) {
      party = await supplierService.getSupplierById(full.supplier_id)
    } else if (full.customer_id) {
      party = await customerService.getCustomerById(full.customer_id)
    }
  } catch {
    party = null
  }

  // 3) واحد کالاها
  const units: Record<number, string> = {}
  const ids = Array.from(new Set((full.items || []).map((i) => i.product_id)))
  await Promise.all(
    ids.map((pid) =>
      productService
        .getProductById(pid)
        .then((p: any) => {
          units[pid] = p?.unit || ''
        })
        .catch(() => null)
    )
  )

  // 4) تنظیمات شرکت (لوگو، نام، ...)
  const s = useSettingsStore.getState()

  // 5) چاپ
  return printInvoice(full, {
    party: party || null,
    partyLabel: full.invoice_type === 'purchase' ? 'تامین‌کننده' : 'مشتری',
    units,
    companyName: s.companyName,
    companyLogo: s.logo,
    companyPhone: s.phone,
    companyEmail: s.email,
    companyAddress: s.address,
  })
}
