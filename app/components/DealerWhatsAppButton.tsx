'use client'

import { useState } from 'react'
import WhatsAppLeadModal, { type LeadModalContext } from './WhatsAppLeadModal'

export default function DealerWhatsAppButton({
  dealerId, dealerSlug, whatsapp, nombreComercial,
}: {
  dealerId: string
  dealerSlug: string
  whatsapp: string
  nombreComercial: string
}) {
  const [open, setOpen] = useState(false)
  const ctx: LeadModalContext = {
    listingId: null,
    listingTitle: nombreComercial,
    listingUrl: typeof window !== 'undefined' ? window.location.href : `https://motopatio.com/dealers/${dealerSlug}`,
    whatsappNumber: whatsapp,
    listingOwnerType: 'dealer',
    listingOwnerId: dealerId,
    dealerId,
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          fetch('/api/leads/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'whatsapp_button_clicked', dealerId }),
          }).catch(() => {})
          setOpen(true)
        }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#25D366', color: '#fff',
          padding: '10px 16px', borderRadius: '4px', border: 'none',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
        }}>
        💬 Escribir por WhatsApp
      </button>
      <WhatsAppLeadModal open={open} onClose={() => setOpen(false)} ctx={ctx} />
    </>
  )
}
