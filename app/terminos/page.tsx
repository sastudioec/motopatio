import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso de la plataforma MotoPatío.',
  alternates: { canonical: 'https://motopatio.com/terminos' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/terminos',
    title: 'Términos y condiciones | MotoPatío',
    description: 'Términos y condiciones de uso de la plataforma MotoPatío.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Términos y condiciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos y condiciones | MotoPatío',
    description: 'Términos y condiciones de uso de MotoPatío.',
    images: ['/og-default.jpg'],
  },
}

export default function TerminosPage() {
  return (
    <main>
      
      <div style={{background:'#f4f4f4',padding:'40px 20px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto',background:'#fff',borderRadius:'10px',padding:'40px 44px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>

          <div style={{borderBottom:'2px solid #E8390E',paddingBottom:'18px',marginBottom:'28px'}}>
            <h1 style={{fontSize:'28px',fontWeight:800,color:'#1a1f36',margin:0}}>Términos y Condiciones</h1>
            <p style={{fontSize:'13px',color:'#888',margin:'6px 0 0 0'}}>Última actualización: 20 de abril de 2026</p>
          </div>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>1. Información de la empresa</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              <strong>MotoPatio</strong> es un servicio operado por <strong>SAStudio LATAM</strong>, compañía constituida bajo las leyes de la República del Ecuador. Contacto: <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a>.
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              Al acceder o usar MotoPatio aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, por favor no utilices la plataforma.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>2. Naturaleza del servicio</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              MotoPatio es una <strong>plataforma de clasificados en línea</strong> que permite a los usuarios publicar y buscar motocicletas y accesorios en Ecuador. MotoPatio <strong>no vende, no compra, no intermedia ni custodia</strong> los bienes publicados.
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              Toda transacción entre usuarios se realiza de forma <strong>directa, privada y bajo exclusiva responsabilidad de las partes</strong>. MotoPatio no es parte de esas transacciones.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>3. Registro de cuenta</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>Al registrarte declaras que:</p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px',marginBottom:'10px'}}>
              <li>Tienes al menos <strong>18 años de edad</strong>.</li>
              <li>La información proporcionada es <strong>veraz, actualizada y completa</strong>.</li>
              <li>Eres el <strong>titular legítimo</strong> de cada vehículo o accesorio que publiques.</li>
              <li>Mantendrás la <strong>confidencialidad</strong> de tu contraseña y serás responsable de toda actividad en tu cuenta.</li>
            </ul>
            <p style={{color:'#444',lineHeight:1.7}}>
              Debes verificar tu correo electrónico antes de publicar. Podemos suspender cuentas con datos falsos o actividad sospechosa.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>4. Planes y pagos</h2>

            <div style={{background:'#fff8e6',border:'1px solid #f5c451',borderLeft:'4px solid #E8390E',borderRadius:'6px',padding:'14px 16px',marginBottom:'14px'}}>
              <p style={{color:'#1a1f36',fontSize:'13px',lineHeight:1.6,margin:0,fontWeight:600}}>
                ⚠️ Aclaración importante sobre nuestro servicio
              </p>
              <p style={{color:'#444',fontSize:'13px',lineHeight:1.6,margin:'8px 0 0 0'}}>
                MotoPatio <strong>no interviene en la compra, venta, negociación ni transacción</strong> de los vehículos publicados. Los pagos que cobramos ($5 plan Básico, $10 plan Full, $7 Add-on Destacado) corresponden <strong>exclusivamente al servicio digital de publicación de anuncios clasificados</strong>. MotoPatio <strong>no recibe, no procesa ni custodia dinero</strong> relacionado con la compraventa del vehículo entre usuarios y <strong>no cobra comisión alguna</strong> sobre el precio de venta.
              </p>
            </div>

            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              MotoPatio <strong>cobra únicamente por la publicación de anuncios</strong> (planes individuales, destacados, posicionamiento). <strong>No cobra comisión sobre ventas</strong> ni participa del precio acordado entre comprador y vendedor.
            </p>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Los precios se muestran en dólares de los Estados Unidos (USD) e incluyen los impuestos aplicables. Los pagos se procesan de forma segura a través de <strong>PayPhone</strong>, pasarela de pagos certificada ecuatoriana que cumple con los estándares PCI-DSS. MotoPatio no almacena datos de tarjetas de crédito. Aceptamos tarjetas de crédito y débito Visa, Mastercard y Diners Club de cualquier banco ecuatoriano, sin necesidad de descargar aplicaciones adicionales.
            </p>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Todos los planes de MotoPatio son <strong>pagos únicos por publicación</strong>. No existen suscripciones, cargos recurrentes ni renovaciones automáticas. Al vencer el plazo contratado (5, 15 o 30 días según el plan), la publicación se desactiva automáticamente. Si el usuario desea volver a publicar, debe realizar un nuevo pago único desde su perfil, sección "Mis publicaciones".
            </p>
            <p style={{color:'#444',lineHeight:1.7}}>
              Los pagos <strong>no son reembolsables</strong> una vez que el anuncio ha sido publicado, salvo las excepciones expresamente previstas en nuestra <a href="/politica-de-reembolsos" style={{color:'#E8390E',fontWeight:600}}>Política de Reembolsos</a>.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>5. Conducta del usuario</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>Queda estrictamente prohibido:</p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px'}}>
              <li>Publicar vehículos con documentación falsificada, robados o de procedencia ilícita.</li>
              <li>Utilizar la plataforma para actividades fraudulentas, lavado de activos o cualquier delito.</li>
              <li>Publicar contenido ofensivo, discriminatorio, ilegal o que infrinja derechos de terceros.</li>
              <li>Usar scrapers, bots o cualquier automatización sin autorización escrita de MotoPatio.</li>
              <li>Crear múltiples cuentas para evadir sanciones, límites o suspensiones.</li>
              <li>Contactar a otros usuarios con fines ajenos a la compraventa del vehículo publicado (spam, phishing, etc.).</li>
            </ul>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>6. Exclusión de responsabilidad</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              MotoPatio <strong>no se hace responsable</strong>, bajo ninguna circunstancia, por:
            </p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px',marginBottom:'10px'}}>
              <li>La <strong>veracidad, exactitud o legalidad</strong> del contenido publicado por los usuarios.</li>
              <li>El <strong>estado, calidad, condición mecánica o legal</strong> de los vehículos o accesorios anunciados.</li>
              <li><strong>Estafas, fraudes, engaños o disputas</strong> entre compradores y vendedores.</li>
              <li>Robos, pérdidas, daños o perjuicios derivados de transacciones realizadas entre usuarios.</li>
              <li>La <strong>validez de documentos</strong> vehiculares (matrícula, título, peritaje, transferencia, pago de matriculación, SOAT, etc.).</li>
              <li>Acuerdos, garantías o promesas que los usuarios se hagan entre sí fuera de la plataforma.</li>
              <li>Interrupciones del servicio por mantenimiento, fallas técnicas o causas de fuerza mayor.</li>
            </ul>
            <p style={{color:'#444',lineHeight:1.7}}>
              <strong>Recomendamos enfáticamente</strong> a los usuarios verificar en persona la documentación del vehículo, realizar la transacción en un lugar seguro y, preferentemente, formalizar la transferencia ante notario público.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>7. Propiedad intelectual</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El diseño, logo, marca, código fuente y demás elementos de MotoPatio son propiedad de <strong>SAStudio LATAM</strong>. Al subir fotografías o contenido a tus anuncios, nos otorgas una licencia no exclusiva, gratuita y revocable al eliminar tu cuenta, para mostrar dicho contenido dentro de la plataforma.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>8. Suspensión y terminación</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              MotoPatio se reserva el derecho de <strong>suspender o eliminar</strong> cuentas, anuncios o contenido que incumplan estos Términos, sin previo aviso y sin derecho a reembolso. Tú puedes eliminar tu cuenta en cualquier momento desde tu perfil.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>9. Privacidad</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El tratamiento de tus datos personales se rige por nuestra <Link href="/politica-de-privacidad" style={{color:'#E8390E',fontWeight:600}}>Política de Privacidad</Link>, que forma parte integral de estos Términos.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>10. Modificaciones</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Podemos actualizar estos Términos en cualquier momento. Los cambios se publicarán en esta misma página, indicando la fecha de última actualización. El uso continuado de la plataforma implica la aceptación de los nuevos Términos.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>11. Ley aplicable y jurisdicción</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Estos Términos se rigen por las leyes de la <strong>República del Ecuador</strong>, lugar de constitución de SAStudio LATAM.
            </p>
          </section>

          <div style={{background:'#f9f9f9',borderRadius:'8px',padding:'20px 24px',border:'1px solid #eee',marginTop:'30px'}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#1a1f36',marginBottom:'6px'}}>¿Preguntas?</h3>
            <p style={{color:'#666',fontSize:'14px',margin:0}}>
              Escríbenos a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a> o visita nuestra <Link href="/contacto" style={{color:'#E8390E',fontWeight:600}}>página de contacto</Link>.
            </p>
          </div>

        </div>
      </div>
      
    </main>
  )
}
