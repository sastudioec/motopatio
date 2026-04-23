import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad y protección de datos personales de MotoPatío, conforme a la LOPDP de Ecuador.',
  alternates: { canonical: 'https://motopatio.com/politica-de-privacidad' },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'MotoPatío',
    url: 'https://motopatio.com/politica-de-privacidad',
    title: 'Política de privacidad | MotoPatío',
    description: 'Protección de datos personales conforme a la LOPDP de Ecuador.',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'MotoPatío — Política de privacidad' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de privacidad | MotoPatío',
    description: 'Protección de datos personales conforme a la LOPDP de Ecuador.',
    images: ['/og-default.jpg'],
  },
}

export default function PoliticaPrivacidadPage() {
  return (
    <main>
      
      <div style={{background:'#f4f4f4',padding:'40px 20px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto',background:'#fff',borderRadius:'10px',padding:'40px 44px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>

          <div style={{borderBottom:'2px solid #E8390E',paddingBottom:'18px',marginBottom:'28px'}}>
            <h1 style={{fontSize:'28px',fontWeight:800,color:'#1a1f36',margin:0}}>Política de Privacidad</h1>
            <p style={{fontSize:'13px',color:'#888',margin:'6px 0 0 0'}}>Última actualización: 20 de abril de 2026</p>
          </div>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>1. Responsable del tratamiento</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El responsable del tratamiento de los datos personales recabados a través de MotoPatio es <strong>SAStudio LATAM</strong>, compañía constituida bajo las leyes de la República del Ecuador. Para cualquier consulta relativa a esta política o al ejercicio de tus derechos, escríbenos a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a>.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>2. Marco legal</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Para usuarios residentes en Ecuador, esta política se rige por la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong>, publicada en el Registro Oficial Suplemento N.° 459 del 26 de mayo de 2021, y su Reglamento. Para usuarios de otros países, aplicamos estándares equivalentes de protección de datos.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>3. Datos que recopilamos</h2>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px'}}>
              <li><strong>Identificación:</strong> nombres, apellidos, correo electrónico.</li>
              <li><strong>Contacto:</strong> número de teléfono, ciudad.</li>
              <li><strong>Autenticación:</strong> contraseña, almacenada cifrada con bcrypt (nunca en texto plano).</li>
              <li><strong>Contenido publicado:</strong> fotografías, marca, modelo, año, kilometraje, precio, placa y descripción de motocicletas o accesorios.</li>
              <li><strong>Datos de pago:</strong> procesados directamente por PayPhone (pasarela certificada ecuatoriana). MotoPatio <strong>no almacena</strong> números de tarjeta ni CVV.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador, registros de actividad en la plataforma.</li>
            </ul>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>4. Finalidades</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>Tus datos se utilizan exclusivamente para:</p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px'}}>
              <li>Crear y gestionar tu cuenta de usuario.</li>
              <li>Permitir la publicación y consulta de anuncios.</li>
              <li>Facilitar el contacto entre compradores y vendedores.</li>
              <li>Procesar pagos por planes y publicaciones.</li>
              <li>Enviar correos transaccionales (verificación, bienvenida, confirmaciones).</li>
              <li>Prevenir fraude y hacer cumplir los Términos y Condiciones.</li>
              <li>Cumplir obligaciones legales y requerimientos de autoridades competentes.</li>
            </ul>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>5. Base legal del tratamiento</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              El tratamiento se realiza con base en: (a) tu <strong>consentimiento expreso</strong> al registrarte y aceptar esta política; (b) la <strong>ejecución del contrato</strong> de uso de la plataforma; (c) el <strong>interés legítimo</strong> en prevenir fraude y mejorar el servicio; y (d) el <strong>cumplimiento de obligaciones legales</strong>.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>6. Datos visibles públicamente</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Al publicar un anuncio, cierta información es visible para todos los visitantes: fotografías, marca, modelo, año, kilometraje, precio, ciudad, descripción y placa (esta última para que compradores apliquen las restricciones vehiculares locales como Pico y Placa). Tu correo y teléfono <strong>solo se muestran si tú lo habilitas</strong>. Tu contraseña nunca se muestra ni se comparte.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>7. Encargados y terceros</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              No vendemos tus datos personales. Contratamos a los siguientes proveedores que actúan como encargados del tratamiento:
            </p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px',marginBottom:'10px'}}>
              <li><strong>PayPhone</strong> — procesamiento seguro de pagos en línea (certificación PCI-DSS).</li>
              <li><strong>Cloudinary</strong> — alojamiento de fotografías.</li>
              <li><strong>Resend</strong> — envío de correos transaccionales.</li>
              <li><strong>Proveedor de hosting</strong> — infraestructura de servidores y base de datos.</li>
            </ul>
            <p style={{color:'#444',lineHeight:1.7}}>
              Estos proveedores pueden implicar <strong>transferencia internacional de datos</strong>. Nos aseguramos de que cuenten con garantías adecuadas conforme a la LOPDP.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>8. Conservación de datos</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Conservamos tus datos mientras tu cuenta permanezca activa. Al eliminar tu cuenta, tus datos personales y publicaciones se borran de forma permanente (cascade delete), salvo aquellos que debamos conservar por obligación legal, fiscal o para resolver disputas pendientes.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>9. Tus derechos</h2>
            <p style={{color:'#444',lineHeight:1.7,marginBottom:'10px'}}>
              Conforme a la LOPDP, tienes derecho a:
            </p>
            <ul style={{color:'#444',lineHeight:1.8,paddingLeft:'22px',marginBottom:'10px'}}>
              <li><strong>Acceso</strong> a tus datos personales.</li>
              <li><strong>Rectificación</strong> de datos inexactos o incompletos.</li>
              <li><strong>Eliminación</strong> (derecho al olvido).</li>
              <li><strong>Oposición</strong> al tratamiento.</li>
              <li><strong>Portabilidad</strong> en formato estructurado.</li>
              <li><strong>Limitación</strong> del tratamiento.</li>
              <li><strong>No ser objeto</strong> de decisiones automatizadas con efectos jurídicos significativos.</li>
            </ul>
            <p style={{color:'#444',lineHeight:1.7}}>
              Para ejercerlos, envía una solicitud a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a> adjuntando copia de tu documento de identidad. Responderemos en un plazo máximo de <strong>15 días hábiles</strong> (Art. 25 LOPDP).
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>10. Seguridad</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Implementamos medidas técnicas y organizativas razonables: cifrado de contraseñas con bcrypt, conexiones HTTPS, autenticación JWT, controles de acceso a la base de datos y copias de seguridad periódicas. Ninguna medida es infalible, pero mantenemos estándares adecuados al riesgo.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>11. Cookies</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Utilizamos cookies <strong>estrictamente necesarias</strong> para mantener tu sesión (JWT de NextAuth). No utilizamos cookies publicitarias ni de seguimiento de terceros.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>12. Menores de edad</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              MotoPatio está dirigido a personas mayores de 18 años. No recopilamos conscientemente datos de menores. Si detectamos una cuenta de un menor, la eliminaremos.
            </p>
          </section>

          <section style={{marginBottom:'26px'}}>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'10px'}}>13. Cambios a esta política</h2>
            <p style={{color:'#444',lineHeight:1.7}}>
              Podemos actualizar esta política en cualquier momento. Los cambios se publicarán en esta página indicando la fecha de última actualización. Si los cambios son significativos, te lo notificaremos por correo electrónico.
            </p>
          </section>

          <div style={{background:'#f9f9f9',borderRadius:'8px',padding:'20px 24px',border:'1px solid #eee',marginTop:'30px'}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#1a1f36',marginBottom:'6px'}}>Contacto</h3>
            <p style={{color:'#666',fontSize:'14px',margin:0}}>
              Para ejercer tus derechos o cualquier consulta sobre tus datos: <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a>.
            </p>
            <p style={{color:'#666',fontSize:'14px',margin:'10px 0 0 0'}}>
              Consulta también nuestros <Link href="/terminos" style={{color:'#E8390E',fontWeight:600}}>Términos y Condiciones</Link>.
            </p>
          </div>

        </div>
      </div>
      
    </main>
  )
}
