'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { puedeCircularElDia } from '@/lib/picoyplaca'
import { PROVINCIAS_ECUADOR } from '@/lib/provincias-ecuador'

export default function MotosPage() {
  const [motos, setMotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [panelMobile, setPanelMobile] = useState(false)

  // Catálogo de marcas desde DB
  const [marcasDB, setMarcasDB] = useState<string[]>([])

  const [filtros, setFiltros] = useState({
    buscar: '',
    precioMin: '',
    precioMax: '',
    anioMin: '',
    anioMax: '',
    kmMax: '',
    marcas: [] as string[],
    provincia: '',
    ciudad: '',
    tipos: [] as string[],
    cilindrajes: [] as string[],
    picoyplaca: '',
    soloElectricas: false,
    orden: 'recientes',
  })

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    precio: true, anio: true, km: false, marcas: false, ubicacion: true,
    tipos: false, cilindrajes: false, picoyplaca: false,
  })

  // Cargar motos
  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(data => {
        setMotos(data.listings || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Cargar marcas desde DB
  useEffect(() => {
    fetch('/api/catalog/brands')
      .then(r => r.json())
      .then(data => {
        const nombres = (data.brands || data || []).map((b: any) => b.name || b.nombre).filter(Boolean)
        setMarcasDB(nombres)
      })
      .catch(() => setMarcasDB([]))
  }, [])

  const TIPOS = ['Urbana','Naked','Trail/Enduro','Scooter','Deportiva','Crucero','Touring','Doble propósito']
  const CILINDRAJES = ['50cc','100cc','110cc','125cc','150cc','160cc','200cc','250cc','300cc','400cc','500cc','600cc','650cc','700cc+']
  const DIAS = [
    {v:'1', label:'Lunes'},
    {v:'2', label:'Martes'},
    {v:'3', label:'Miércoles'},
    {v:'4', label:'Jueves'},
    {v:'5', label:'Viernes'},
  ]

  const PROVINCIAS_NOMBRES = PROVINCIAS_ECUADOR.map((p: any) => p.nombre).sort((a: string, b: string) => a.localeCompare(b))
  const ciudadesDeProvincia = useMemo(() => {
    if (!filtros.provincia) return [] as string[]
    const prov = PROVINCIAS_ECUADOR.find((p: any) => p.nombre === filtros.provincia)
    return prov ? [...prov.ciudades].sort((a: string, b: string) => a.localeCompare(b)) : []
  }, [filtros.provincia])

  const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const motosFiltradas = useMemo(() => {
    let r = motos.filter(m => m.estado === 'activo')
    if (filtros.buscar) {
      const q = filtros.buscar.toLowerCase()
      r = r.filter(m => (m.marca + ' ' + m.modelo).toLowerCase().includes(q))
    }
    if (filtros.soloElectricas) r = r.filter(m => m.esElectrica === true)
    if (filtros.precioMin) r = r.filter(m => m.precio >= parseInt(filtros.precioMin))
    if (filtros.precioMax) r = r.filter(m => m.precio <= parseInt(filtros.precioMax))
    if (filtros.anioMin) r = r.filter(m => m.anio >= parseInt(filtros.anioMin))
    if (filtros.anioMax) r = r.filter(m => m.anio <= parseInt(filtros.anioMax))
    if (filtros.kmMax) r = r.filter(m => m.km <= parseInt(filtros.kmMax))
    if (filtros.marcas.length) r = r.filter(m => filtros.marcas.includes(m.marca))
    if (filtros.provincia) r = r.filter(m => m.provincia === filtros.provincia)
    if (filtros.ciudad) r = r.filter(m => m.ciudad === filtros.ciudad)
    if (filtros.tipos.length) r = r.filter(m => filtros.tipos.includes(m.tipo))
    if (filtros.cilindrajes.length && !filtros.soloElectricas) {
      r = r.filter(m => filtros.cilindrajes.includes(m.cilindraje))
    }
    if (filtros.picoyplaca) {
      const dia = parseInt(filtros.picoyplaca)
      r = r.filter(m => puedeCircularElDia(m.placa || '', m.ciudad || '', dia))
    }

    if (filtros.orden === 'precio_asc') r = [...r].sort((a,b) => a.precio - b.precio)
    else if (filtros.orden === 'precio_desc') r = [...r].sort((a,b) => b.precio - a.precio)
    else if (filtros.orden === 'km_asc') r = [...r].sort((a,b) => a.km - b.km)
    else if (filtros.orden === 'destacadas') r = [...r].sort((a,b) => (b.destacado?1:0) - (a.destacado?1:0))
    return r
  }, [motos, filtros])

  const limpiarFiltros = () => setFiltros({
    buscar:'', precioMin:'', precioMax:'', anioMin:'', anioMax:'', kmMax:'',
    marcas:[], provincia:'', ciudad:'', tipos:[], cilindrajes:[],
    picoyplaca:'', soloElectricas:false, orden:'recientes',
  })

  const toggleSec = (k: keyof typeof seccionesAbiertas) => setSeccionesAbiertas({...seccionesAbiertas, [k]: !seccionesAbiertas[k]})

  // Panel de filtros (reusable desktop + mobile)
  const PanelFiltros = () => (
    <div style={{background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',overflow:'hidden'}}>
      <div style={{padding:'16px',borderBottom:'1px solid #f0f0f0'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'#1E2340',textTransform:'uppercase',marginBottom:'10px'}}>Buscar</div>
        <input value={filtros.buscar} onChange={e=>setFiltros({...filtros,buscar:e.target.value})}
          style={{width:'100%',padding:'9px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',boxSizing:'border-box'}}
          placeholder="Marca o modelo..." />

        <label style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'12px',cursor:'pointer',fontSize:'13px',color:'#1E2340',fontWeight:600}}>
          <input type="checkbox" checked={filtros.soloElectricas}
            onChange={e=>setFiltros({...filtros,soloElectricas:e.target.checked})}
            style={{cursor:'pointer',width:'16px',height:'16px'}} />
          ⚡ Solo eléctricas
        </label>
      </div>

      <Acordeon titulo="Ubicación" abierto={seccionesAbiertas.ubicacion} onToggle={()=>toggleSec('ubicacion')}>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          <select value={filtros.provincia}
            onChange={e=>setFiltros({...filtros,provincia:e.target.value,ciudad:''})}
            style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',boxSizing:'border-box',background:'#fff'}}>
            <option value="">Todas las provincias</option>
            {PROVINCIAS_NOMBRES.map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filtros.ciudad}
            onChange={e=>setFiltros({...filtros,ciudad:e.target.value})}
            disabled={!filtros.provincia}
            style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',boxSizing:'border-box',background:filtros.provincia?'#fff':'#f4f4f4',color:filtros.provincia?'#333':'#999'}}>
            <option value="">{filtros.provincia ? 'Todas las ciudades' : 'Elige provincia primero'}</option>
            {ciudadesDeProvincia.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Acordeon>

      <Acordeon titulo="Precio" abierto={seccionesAbiertas.precio} onToggle={()=>toggleSec('precio')}>
        <DosInputs
          a={filtros.precioMin} setA={(v:string)=>setFiltros({...filtros,precioMin:v})} placeA="Desde"
          b={filtros.precioMax} setB={(v:string)=>setFiltros({...filtros,precioMax:v})} placeB="Hasta"
        />
      </Acordeon>

      <Acordeon titulo="Año" abierto={seccionesAbiertas.anio} onToggle={()=>toggleSec('anio')}>
        <DosInputs
          a={filtros.anioMin} setA={(v:string)=>setFiltros({...filtros,anioMin:v})} placeA="Desde"
          b={filtros.anioMax} setB={(v:string)=>setFiltros({...filtros,anioMax:v})} placeB="Hasta"
        />
      </Acordeon>

      <Acordeon titulo="Kilometraje" abierto={seccionesAbiertas.km} onToggle={()=>toggleSec('km')}>
        <select value={filtros.kmMax} onChange={e=>setFiltros({...filtros,kmMax:e.target.value})}
          style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',boxSizing:'border-box'}}>
          <option value="">Cualquier</option>
          <option value="5000">Hasta 5,000 km</option>
          <option value="10000">Hasta 10,000 km</option>
          <option value="20000">Hasta 20,000 km</option>
          <option value="50000">Hasta 50,000 km</option>
          <option value="100000">Hasta 100,000 km</option>
        </select>
      </Acordeon>

      <Acordeon titulo="Pico y Placa Quito" abierto={seccionesAbiertas.picoyplaca} onToggle={()=>toggleSec('picoyplaca')}>
        <div style={{fontSize:'11px',color:'#888',marginBottom:'8px',lineHeight:1.4}}>
          Ver motos que puedes circular este día:
        </div>
        <select value={filtros.picoyplaca} onChange={e=>setFiltros({...filtros,picoyplaca:e.target.value})}
          style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',boxSizing:'border-box'}}>
          <option value="">Mostrar todas</option>
          {DIAS.map(d => <option key={d.v} value={d.v}>Puedo usar el {d.label}</option>)}
        </select>
      </Acordeon>

      <Acordeon titulo={'Marcas' + (filtros.marcas.length ? ' (' + filtros.marcas.length + ')' : '')} abierto={seccionesAbiertas.marcas} onToggle={()=>toggleSec('marcas')}>
        {marcasDB.length === 0 ? (
          <div style={{fontSize:'12px',color:'#888'}}>Cargando marcas...</div>
        ) : (
          <Checks items={marcasDB} selected={filtros.marcas} onChange={(v:string)=>setFiltros({...filtros,marcas:toggleArr(filtros.marcas,v)})} />
        )}
      </Acordeon>

      <Acordeon titulo={'Tipo' + (filtros.tipos.length ? ' (' + filtros.tipos.length + ')' : '')} abierto={seccionesAbiertas.tipos} onToggle={()=>toggleSec('tipos')}>
        <Checks items={TIPOS} selected={filtros.tipos} onChange={(v:string)=>setFiltros({...filtros,tipos:toggleArr(filtros.tipos,v)})} />
      </Acordeon>

      {!filtros.soloElectricas && (
        <Acordeon titulo={'Cilindraje' + (filtros.cilindrajes.length ? ' (' + filtros.cilindrajes.length + ')' : '')} abierto={seccionesAbiertas.cilindrajes} onToggle={()=>toggleSec('cilindrajes')}>
          <Checks items={CILINDRAJES} selected={filtros.cilindrajes} onChange={(v:string)=>setFiltros({...filtros,cilindrajes:toggleArr(filtros.cilindrajes,v)})} />
        </Acordeon>
      )}

      <div style={{padding:'16px'}}>
        <button onClick={limpiarFiltros}
          style={{width:'100%',padding:'10px',background:'#f4f4f4',color:'#666',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'12px',fontWeight:700,cursor:'pointer',textTransform:'uppercase'}}>
          Limpiar filtros
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f4f4f4'}}>
      <div style={{maxWidth:'1200px',margin:'24px auto',padding:'0 16px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <h1 style={{fontFamily:'Poppins,sans-serif',fontSize:'24px',fontWeight:900,color:'#1E2340'}}>Motos en venta</h1>
            <div style={{fontSize:'13px',color:'#888',marginTop:'2px'}}>
              {loading ? 'Cargando...' : motosFiltradas.length + ' motos encontradas'}
            </div>
          </div>
          <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
            <button onClick={()=>setPanelMobile(true)} className="btn-filtros-mobile"
              style={{background:'#1E2340',color:'white',border:'none',padding:'10px 16px',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
              ☰ Filtros
            </button>
            <select value={filtros.orden} onChange={e=>setFiltros({...filtros,orden:e.target.value})}
              style={{padding:'9px 12px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',background:'#fff'}}>
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Precio menor a mayor</option>
              <option value="precio_desc">Precio mayor a menor</option>
              <option value="km_asc">Menor kilometraje</option>
              <option value="destacadas">Destacadas primero</option>
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'20px',alignItems:'flex-start'}} className="grid-motos">
          <aside className="panel-desktop" style={{position:'sticky',top:'86px'}}>
            <PanelFiltros />
          </aside>

          <div>
            {loading ? (
              <div style={{textAlign:'center',padding:'60px',color:'#888'}}>Cargando motos...</div>
            ) : motosFiltradas.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px',background:'#fff',borderRadius:'8px',color:'#888',border:'1px solid #e8e8e8'}}>
                <div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div>
                <div style={{fontSize:'15px',fontWeight:600,marginBottom:'8px'}}>No se encontraron motos con esos filtros</div>
                <button onClick={limpiarFiltros} style={{background:'#E8390E',color:'white',border:'none',padding:'10px 20px',borderRadius:'4px',fontSize:'13px',fontWeight:700,cursor:'pointer',marginTop:'10px'}}>Limpiar filtros</button>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
                {motosFiltradas.map(l => {
                  const fotos = (() => { try { return JSON.parse(l.fotos || '[]') } catch { return [] } })()
                  const ubicacion = l.provincia ? `${l.ciudad}, ${l.provincia}` : l.ciudad
                  return (
                    <Link key={l.id} href={'/motos/' + l.id} style={{textDecoration:'none'}}>
                      <div style={{background:'#fff',borderRadius:'6px',overflow:'hidden',border: l.destacado ? '1.5px solid #E8390E' : '1.5px solid #e8e8e8'}}>
                        <div style={{height:'140px',background:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'40px',position:'relative'}}>
                          {fotos[0] ? <img src={fotos[0]} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🏍️'}
                          {l.destacado && <div style={{position:'absolute',top:0,right:0,background:'#E8390E',color:'white',fontSize:'9px',fontWeight:800,padding:'4px 10px'}}>DESTACADA</div>}
                          {l.esElectrica && <div style={{position:'absolute',top:0,left:0,background:'#10B981',color:'white',fontSize:'9px',fontWeight:800,padding:'4px 8px'}}>⚡ ELÉCTRICA</div>}
                        </div>
                        <div style={{padding:'12px'}}>
                          <div style={{fontSize:'13px',fontWeight:700,color:'#1E2340',textTransform:'uppercase',marginBottom:'2px'}}>{l.marca} {l.modelo}</div>
                          <div style={{fontSize:'20px',fontWeight:800,color:'#E8390E',marginBottom:'4px'}}>${l.precio?.toLocaleString()}</div>
                          <div style={{fontSize:'11px',color:'#999',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                            <span>{l.anio}</span>
                            <span>{l.km?.toLocaleString()} km</span>
                          </div>
                          {ubicacion && <div style={{fontSize:'11px',color:'#999',marginTop:'3px'}}>📍 {ubicacion}</div>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {panelMobile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',justifyContent:'flex-end'}}>
          <div style={{width:'85%',maxWidth:'min(360px, 100vw)',background:'#f4f4f4',height:'100%',overflowY:'auto',overflowX:'hidden',padding:'16px',boxSizing:'border-box'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <div style={{fontSize:'16px',fontWeight:800,color:'#1E2340'}}>Filtros</div>
              <button onClick={()=>setPanelMobile(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'#888'}}>✕</button>
            </div>
            <PanelFiltros />
            <button onClick={()=>setPanelMobile(false)} style={{width:'100%',marginTop:'14px',padding:'14px',background:'#E8390E',color:'white',border:'none',borderRadius:'4px',fontSize:'14px',fontWeight:800,cursor:'pointer'}}>
              Ver {motosFiltradas.length} motos
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .grid-motos { grid-template-columns: 1fr !important; }
          .panel-desktop { display: none !important; }
          .btn-filtros-mobile { display: inline-block !important; }
        }
        @media (min-width: 769px) {
          .btn-filtros-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ---------- Subcomponentes ----------
function Acordeon({ titulo, abierto, onToggle, children }: any) {
  return (
    <div style={{borderBottom:'1px solid #f0f0f0'}}>
      <button onClick={onToggle} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',background:'transparent',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,color:'#1E2340',textAlign:'left'}}>
        <span>{titulo}</span>
        <span style={{fontSize:'16px',color:'#E8390E',fontWeight:700}}>{abierto ? '−' : '+'}</span>
      </button>
      {abierto && <div style={{padding:'0 16px 14px'}}>{children}</div>}
    </div>
  )
}

function DosInputs({ a, setA, placeA, b, setB, placeB }: any) {
  return (
    <div style={{display:'flex',gap:'6px'}}>
      <input value={a} onChange={e=>setA(e.target.value.replace(/\D/g,''))} placeholder={placeA}
        style={{flex:1,padding:'8px 10px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',width:'100%',boxSizing:'border-box'}} />
      <input value={b} onChange={e=>setB(e.target.value.replace(/\D/g,''))} placeholder={placeB}
        style={{flex:1,padding:'8px 10px',border:'1px solid #e0e0e0',borderRadius:'4px',fontSize:'13px',width:'100%',boxSizing:'border-box'}} />
    </div>
  )
}

function Checks({ items, selected, onChange }: any) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'6px',maxHeight:'200px',overflowY:'auto'}}>
      {items.map((it: string) => (
        <label key={it} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#333',cursor:'pointer',padding:'2px 0'}}>
          <input type="checkbox" checked={selected.includes(it)} onChange={()=>onChange(it)} style={{cursor:'pointer'}} />
          {it}
        </label>
      ))}
    </div>
  )
}
