/**
 * Helpers cliente para cargar y abrir la Cajita de PayPhone.
 * Usado por /publicar (compra de plan) y /mis-motos (compra de add-on).
 */

export type CajitaConfig = {
  token: string
  storeId: string
  clientTransactionId: string
  amount: number
  amountWithoutTax: number
  amountWithTax: number
  tax: number
  service: number
  tip: number
  currency: string
  reference: string
  lang: string
  defaultMethod: string
  cssUrl: string
  jsUrl: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { PPaymentButtonBox?: any } }

/**
 * Carga dinamica del CSS/JS de la Cajita. Idempotente: si los assets
 * ya estan en el DOM no los agrega de nuevo; si el bundle JS ya expuso
 * window.PPaymentButtonBox resuelve inmediato.
 */
export function loadCajitaAssets(cssUrl: string, jsUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-payphone="css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssUrl
      link.dataset.payphone = 'css'
      document.head.appendChild(link)
    }
    if (window.PPaymentButtonBox) {
      resolve()
      return
    }
    let script = document.querySelector('script[data-payphone="js"]') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.type = 'module'
      script.src = jsUrl
      script.dataset.payphone = 'js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('No se pudo cargar el script de PayPhone'))
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', () => resolve())
      script.addEventListener('error', () => reject(new Error('No se pudo cargar el script de PayPhone')))
    }
  })
}

/**
 * Abre la Cajita renderizandola en un contenedor con el id dado.
 * Si el contenedor no existe lo crea appendChild al body.
 * Espera hasta 3s a que window.PPaymentButtonBox este disponible.
 */
export async function openCajita(cfg: CajitaConfig, containerId = 'pp-button'): Promise<void> {
  await loadCajitaAssets(cfg.cssUrl, cfg.jsUrl)
  const start = Date.now()
  while (!window.PPaymentButtonBox && Date.now() - start < 3000) {
    await new Promise((r) => setTimeout(r, 100))
  }
  if (!window.PPaymentButtonBox) {
    throw new Error('PayPhone no se cargó. Intenta recargar la página.')
  }
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }
  const ppb = new window.PPaymentButtonBox({
    token: cfg.token,
    clientTransactionId: cfg.clientTransactionId,
    amount: cfg.amount,
    amountWithoutTax: cfg.amountWithoutTax,
    amountWithTax: cfg.amountWithTax,
    tax: cfg.tax,
    service: cfg.service,
    tip: cfg.tip,
    currency: cfg.currency,
    storeId: cfg.storeId,
    reference: cfg.reference,
    lang: cfg.lang,
    defaultMethod: cfg.defaultMethod,
  })
  ppb.render(containerId)
}
