import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de reembolsos',
  description: 'Política de reembolsos de MotoPatío. Pagos únicos por publicación, sin suscripciones ni cargos recurrentes.',
  alternates: { canonical: 'https://motopatio.com/politica-de-reembolsos' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/politica-de-reembolsos',
    title: 'Política de reembolsos | MotoPatío',
    description: 'Pagos únicos por publicación, sin suscripciones ni cargos recurrentes.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Política de reembolsos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de reembolsos | MotoPatío',
    description: 'Pagos únicos por publicación. Sin suscripciones.',
    images: ['/og-default.jpg'],
  },
}

export default function PoliticaReembolsosPage() {
  return (
    <main>
      <div style={{background:'#f4f4f4',padding:'40px 20px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto',background:'#fff',borderRadius:'10px',padding:'40px 44px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>

          <div style={{borderBottom:'2px solid #E8390E',paddingBottom:'18px',marginBottom:'28px'}}>
            <h1 style={{fontSize:'28px',fontWeight:800,color:'#1a1f36',margin:0}}>Política de Reembolsos</h1>
            <p style={{fontSize:'13px',color:'#888',margin:'6px 0 0 0'}}>Última actualización: 21 de abril de 2026</p>
          </div>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>1. Principio general</h2>

            <div style={{background:'#fff8e6',border:'1px solid #f5c451',borderLeft:'4px solid #E8390E',borderRadius:'6px',padding:'14px 16px',marginBottom:'14px'}}>
              <p style={{color:'#1a1f36',fontSize:'13px',lineHeight:1.6,margin:0,fontWeight:600}}>
                ⚠️ Naturaleza del servicio cobrado
              </p>
              <p style={{color:'#444',fontSize:'13px',lineHeight:1.6,margin:'8px 0 0 0'}}>
                MotoPatio cobra únicamente por la <strong>publicación digital de anuncios clasificados</strong>. No vendemos vehículos, no intermediamos transacciones de compraventa, no recibimos pagos entre usuarios y no cobramos comisiones sobre ventas. El pago que procesas con nosotros corresponde al <strong>espacio publicitario</strong> por un número determinado de días, el cual se entrega de forma inmediata al activarse tu publicación.
              </p>
            </div>

            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Todos los planes de MotoPatio son <strong>pagos únicos por publicación</strong>. No existen suscripciones, cargos recurrentes ni renovaciones automáticas. Al completar tu pago, tu publicación se activa de forma inmediata y permanece visible por el tiempo contratado (5, 15 o 30 días según el plan).
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              En consecuencia, y dada la naturaleza del servicio, <strong>los pagos no son reembolsables</strong>, salvo las excepciones expresamente descritas en la sección 3. Al completar tu pago aceptas expresamente esta condición.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>2. Qué sucede al expirar tu publicación</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Al vencer el plazo contratado, tu anuncio se <strong>desactiva automáticamente</strong> y deja de aparecer en el catálogo público. No se realizan cobros adicionales ni se prorroga el servicio de forma automática.
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              Si aún no has vendido tu vehículo y deseas seguir mostrándolo, puedes <strong>republicarlo manualmente</strong> desde tu perfil, sección "Mis publicaciones", eligiendo el plan que prefieras y realizando un nuevo pago único.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>3. Casos en los que SÍ aplica reembolso</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>Se procederá al reembolso íntegro únicamente en los siguientes casos:</p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px'}}>
              <li><strong>Cobro duplicado:</strong> se cobró dos o más veces la misma publicación por error del sistema.</li>
              <li><strong>Cobro por monto incorrecto:</strong> se cobró un valor distinto al que figura en el plan seleccionado.</li>
              <li><strong>Falla técnica imputable a MotoPatio:</strong> la publicación no fue visible en el catálogo por un error comprobable de la plataforma durante la totalidad o mayoría de su vigencia.</li>
              <li><strong>Cobro no autorizado:</strong> uso no autorizado del método de pago reportado a tiempo (sujeto a verificación con PayPhone y el banco emisor).</li>
            </ul>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>4. Casos en los que NO aplica reembolso</h2>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px'}}>
              <li>Cambio de opinión tras haber completado el pago.</li>
              <li>Venta exitosa del vehículo antes del vencimiento (el servicio contratado es el espacio publicitario, no la venta).</li>
              <li>No haber vendido el vehículo durante la vigencia de la publicación.</li>
              <li>Eliminación de la publicación por incumplimiento de los <Link href="/terminos" style={{color:'#E8390E',fontWeight:600}}>Términos y Condiciones</Link> (contenido falso, vehículo robado, datos fraudulentos, etc.).</li>
              <li>Eliminación voluntaria de la publicación por parte del usuario antes de su vencimiento.</li>
              <li>Pausa manual de la publicación por parte del usuario.</li>
              <li>Compras del <strong>Add-on Destacado</strong>, por tratarse de un servicio inmediato de activación manual (ver sección 5).</li>
              <li>Quejas sobre la funcionalidad o estética del sitio tras haber completado el pago.</li>
            </ul>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>5. Add-on Destacado</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El Add-on Destacado es una <strong>compra única no recurrente</strong> de activación inmediata. <strong>No es reembolsable</strong> bajo ninguna circunstancia una vez activado, salvo que la publicación base caiga por un fallo técnico imputable a MotoPatio antes de consumir sus 7 días, caso en que se procederá al reembolso proporcional de los días no disfrutados.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>6. Plan Gratis</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El Plan Gratis no implica cobro alguno y, por tanto, no genera derecho a reembolso. Está limitado a <strong>una publicación cada 30 días</strong> por usuario.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>7. Cómo solicitar un reembolso</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Envía un correo a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a> con la siguiente información:
            </p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px',marginBottom:'10px'}}>
              <li>Asunto: <strong>"Solicitud de reembolso"</strong>.</li>
              <li>Correo electrónico registrado en tu cuenta.</li>
              <li>Número de transacción de PayPhone (aparece en el recibo recibido por correo).</li>
              <li>Motivo de la solicitud y documentación de respaldo, si aplica.</li>
            </ul>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              <strong>Plazo máximo para solicitar:</strong> hasta <strong>7 días</strong> después del cobro.
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              <strong>Respuesta:</strong> responderemos en un máximo de <strong>48 horas hábiles</strong>. Si el reembolso es aprobado, se procesará a través de <strong>PayPhone</strong> a la tarjeta original. El tiempo de acreditación depende del banco emisor y puede tomar entre <strong>5 y 15 días hábiles</strong>.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>8. Procesamiento de pagos</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Todos los pagos en MotoPatio son procesados por <strong>PayPhone</strong>, pasarela de pagos certificada ecuatoriana. MotoPatio no almacena datos de tarjetas de crédito. Las disputas de cobros (chargebacks) deben iniciarse primero con nosotros a través de <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a> para evitar cargos adicionales y posibles suspensiones de cuenta.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>9. Modificaciones</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              MotoPatio se reserva el derecho de modificar esta política en cualquier momento. Los cambios se publicarán en esta misma página indicando la fecha de última actualización y aplicarán a las transacciones realizadas a partir de esa fecha.
            </p>
          </section>

          <div style={{background:'#f9f9f9',borderRadius:'8px',padding:'20px 24px',border:'1px solid #eee',marginTop:'30px'}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#1a1f36',marginBottom:'6px'}}>¿Preguntas sobre un cobro?</h3>
            <p style={{color:'#666',fontSize:'14px',margin:0}}>
              Escríbenos a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a>. También puedes consultar nuestros <Link href="/terminos" style={{color:'#E8390E',fontWeight:600}}>Términos y Condiciones</Link> y nuestra <Link href="/politica-de-privacidad" style={{color:'#E8390E',fontWeight:600}}>Política de Privacidad</Link>.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
