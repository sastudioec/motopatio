import Link from 'next/link'

export const metadata = {
  title: 'Centro de Ayuda | MotoPatio',
  description: 'Preguntas frecuentes sobre MotoPatio: cómo publicar anuncios, planes, pagos, renovaciones, cuenta y más.',
}

const secciones = [
  {
    titulo: 'Sobre MotoPatio',
    preguntas: [
      {
        q: '¿Qué es MotoPatio?',
        r: 'MotoPatio es una plataforma de clasificados digitales enfocada en motocicletas y accesorios en Ecuador. Conectamos a compradores y vendedores mediante anuncios en línea. No vendemos vehículos ni intermediamos transacciones entre usuarios.',
      },
      {
        q: '¿Cobran comisión por las ventas?',
        r: 'No. Solo cobramos por el servicio de publicación del anuncio (planes Básico o Full). No cobramos ningún porcentaje ni comisión sobre el precio al que vendas tu vehículo.',
      },
      {
        q: '¿Dónde opera MotoPatio?',
        r: 'MotoPatio es operado por SAStudio LATAM, compañía constituida en Ecuador. Actualmente nuestro servicio está enfocado en el mercado ecuatoriano.',
      },
    ],
  },
  {
    titulo: 'Cuenta y registro',
    preguntas: [
      {
        q: '¿Cómo creo una cuenta?',
        r: 'Haz clic en "Ingresar" en la parte superior derecha y luego en "Crear cuenta". Puedes registrarte con tu correo electrónico o con tu cuenta de Google. Una vez registrado, verifica tu correo para poder publicar.',
      },
      {
        q: '¿Olvidé mi contraseña, qué hago?',
        r: 'Próximamente habilitaremos la recuperación automática de contraseña. Por ahora, escríbenos a info@motopatio.com desde el correo asociado a tu cuenta y te ayudaremos a restablecerla.',
      },
      {
        q: '¿Cómo elimino mi cuenta?',
        r: 'Ingresa a Mi perfil y busca la opción "Eliminar cuenta". Esto borrará permanentemente tu cuenta y todas tus publicaciones activas. La acción no puede revertirse.',
      },
    ],
  },
  {
    titulo: 'Publicaciones y planes',
    preguntas: [
      {
        q: '¿Cómo publico mi primer anuncio?',
        r: 'Ingresa con tu cuenta, haz clic en el botón naranja "+ Publicar" del menú superior y completa el formulario con los datos de tu vehículo. Luego elige un plan (Gratis, Básico o Full) y confirma.',
      },
      {
        q: '¿Cuáles son los planes disponibles?',
        r: 'Ofrecemos tres planes: Gratis ($0, 5 días, 1 por mes), Básico ($5, 15 días) y Full ($10, 30 días, incluye 7 días de destacado). Todos son pagos únicos por publicación, sin suscripciones ni cargos recurrentes. Consulta detalles en /precios.',
      },
      {
        q: '¿Puedo tener más de un anuncio activo al mismo tiempo?',
        r: 'Sí. Puedes tener varios anuncios activos simultáneamente, cada uno con su propio plan. El plan Gratis sí está limitado a una publicación cada 30 días por usuario.',
      },
      {
        q: '¿Qué pasa cuando expira mi anuncio?',
        r: 'El anuncio se desactiva automáticamente y deja de aparecer en el catálogo. Si aún no has vendido tu vehículo, puedes republicarlo manualmente desde "Mis publicaciones" eligiendo el plan que prefieras y realizando un nuevo pago.',
      },
      {
        q: '¿Puedo editar mi anuncio después de publicarlo?',
        r: 'Sí. Desde "Mis publicaciones" en tu perfil puedes editar fotos, descripción, precio y otros detalles mientras el anuncio esté activo.',
      },
      {
        q: '¿Qué es el Add-on Destacado?',
        r: 'Es una compra única de $7 que hace que tu anuncio aparezca primero en el catálogo y en el home durante 7 días. Disponible para planes Básico y Full (cuando venza el destacado incluido en Full). Como todos nuestros planes, es un pago único, no se renueva automáticamente.',
      },
    ],
  },
  {
    titulo: 'Pagos y renovaciones',
    preguntas: [
      {
        q: '¿Qué métodos de pago aceptan?',
        r: 'Procesamos los pagos a través de PayPhone, pasarela certificada ecuatoriana. Aceptamos tarjetas de crédito y débito Visa, Mastercard y Diners Club de cualquier banco ecuatoriano. No necesitas descargar ninguna app: el pago se realiza directamente desde el sitio web ingresando los datos de tu tarjeta.',
      },
      {
        q: '¿Cómo funciona la renovación automática?',
        r: 'Los planes Básico y Full se renuevan automáticamente al finalizar su período de vigencia (15 o 30 días respectivamente). Te enviamos un correo recordatorio entre 24 y 48 horas antes de cada cobro.',
      },
      {
        q: '¿Cómo cancelo la renovación automática?',
        r: 'Ingresa a Mi perfil → Mis publicaciones → selecciona el anuncio → haz clic en "Cancelar renovación automática". La cancelación debe realizarse al menos 24 horas antes de la fecha de renovación programada.',
      },
      {
        q: '¿Qué pasa cuando cancelo la renovación?',
        r: 'Tu anuncio permanece activo hasta completar el período ya pagado. No se realizan cobros posteriores y expira normalmente al finalizar su vigencia. No se emiten reembolsos proporcionales por días no consumidos.',
      },
      {
        q: '¿Puedo solicitar un reembolso?',
        r: 'Sí, en casos específicos como cobros duplicados, errores de facturación o fallas técnicas imputables a MotoPatio. Consulta todos los detalles en nuestra Política de Reembolsos.',
      },
    ],
  },
  {
    titulo: 'Compra y venta entre usuarios',
    preguntas: [
      {
        q: '¿MotoPatio se encarga de la transacción?',
        r: 'No. MotoPatio es únicamente una plataforma de publicación de anuncios. Toda negociación, pago y entrega del vehículo se realiza directamente entre comprador y vendedor, bajo su exclusiva responsabilidad.',
      },
      {
        q: '¿Cómo contacto al vendedor de un anuncio?',
        r: 'Cada anuncio muestra los datos de contacto que el vendedor haya decidido hacer públicos (correo, teléfono o WhatsApp). Contáctalo directamente desde el anuncio.',
      },
      {
        q: '¿Qué recomiendan para una compra segura?',
        r: 'Recomendamos: (1) verificar en persona la documentación del vehículo (matrícula, título, estado de pagos); (2) realizar la transacción en un lugar seguro; (3) formalizar la transferencia ante notario público; (4) desconfiar de ofertas demasiado buenas o pagos por adelantado solicitados por el vendedor.',
      },
      {
        q: 'Sospecho que un anuncio es fraudulento, ¿qué hago?',
        r: 'Escríbenos de inmediato a info@motopatio.com con el enlace del anuncio y la descripción de la situación. Investigaremos y, de confirmarse, eliminaremos el anuncio y suspenderemos la cuenta responsable.',
      },
    ],
  },
  {
    titulo: 'Soporte técnico',
    preguntas: [
      {
        q: 'No me llega el correo de verificación',
        r: 'Revisa tu carpeta de spam o correo no deseado. Si no llega en 5 minutos, puedes solicitar un reenvío desde la página de registro. Si persiste, contáctanos.',
      },
      {
        q: 'No puedo subir fotos a mi anuncio',
        r: 'Verifica que las fotos sean JPG, PNG o WebP y pesen menos de 5 MB cada una. Si el problema continúa, prueba con otro navegador o escríbenos con captura del error.',
      },
      {
        q: '¿Cómo reporto un error de la plataforma?',
        r: 'Envíanos un correo a info@motopatio.com describiendo el problema, el navegador que usas y, de ser posible, una captura de pantalla. Respondemos en un máximo de 48 horas hábiles.',
      },
    ],
  },
]

export default function AyudaPage() {
  return (
    <main>
      <div style={{background:'#f4f4f4',padding:'40px 20px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto',background:'#fff',borderRadius:'10px',padding:'40px 44px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>

          <div style={{borderBottom:'2px solid #E8390E',paddingBottom:'18px',marginBottom:'28px'}}>
            <h1 style={{fontSize:'28px',fontWeight:800,color:'#1a1f36',margin:0}}>Centro de Ayuda</h1>
            <p style={{fontSize:'14px',color:'#666',margin:'8px 0 0 0'}}>Respuestas a las preguntas más frecuentes sobre MotoPatio.</p>
          </div>

          {secciones.map((sec) => (
            <section key={sec.titulo} style={{marginBottom:'32px'}}>
              <h2 style={{fontSize:'18px',fontWeight:700,color:'#1a1f36',marginBottom:'14px',borderLeft:'4px solid #E8390E',paddingLeft:'12px'}}>{sec.titulo}</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                {sec.preguntas.map((p) => (
                  <details key={p.q} style={{background:'#fafafa',border:'1px solid #eee',borderRadius:'6px',padding:'14px 18px'}}>
                    <summary style={{fontSize:'14px',fontWeight:700,color:'#1a1f36',cursor:'pointer',listStyle:'none'}}>
                      {p.q}
                    </summary>
                    <p style={{color:'#444',fontSize:'13px',lineHeight:1.7,margin:'10px 0 0 0'}}>{p.r}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div style={{background:'#fff8e6',border:'1px solid #f5c451',borderLeft:'4px solid #E8390E',borderRadius:'8px',padding:'20px 24px',marginTop:'20px'}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#1a1f36',marginBottom:'6px'}}>¿No encuentras la respuesta?</h3>
            <p style={{color:'#444',fontSize:'13px',lineHeight:1.6,margin:0}}>
              Escríbenos a <a href="mailto:info@motopatio.com" style={{color:'#E8390E',fontWeight:600}}>info@motopatio.com</a> o visita nuestra <Link href="/contacto" style={{color:'#E8390E',fontWeight:600}}>página de contacto</Link>. Te respondemos en un máximo de 48 horas hábiles.
            </p>
            <p style={{color:'#666',fontSize:'12px',margin:'10px 0 0 0'}}>
              Consulta también nuestros <Link href="/terminos" style={{color:'#E8390E',fontWeight:600}}>Términos y Condiciones</Link>, <Link href="/politica-de-privacidad" style={{color:'#E8390E',fontWeight:600}}>Política de Privacidad</Link> y <Link href="/politica-de-reembolsos" style={{color:'#E8390E',fontWeight:600}}>Política de Reembolsos</Link>.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
