import Link from 'next/link'
const L = [
  {id:'1',n:'Yamaha FZ 2.0',p:3200,a:2022,k:8500,c:'Quito',d:true,v:true},
  {id:'2',n:'Honda CB 300R',p:5800,a:2023,k:4200,c:'Quito',d:true,v:false},
  {id:'3',n:'Kawasaki Z400',p:7200,a:2023,k:3100,c:'Guayaquil',d:true,v:true},
  {id:'4',n:'Yamaha MT-03',p:6500,a:2022,k:5000,c:'Quito',d:true,v:false},
  {id:'5',n:'Honda PCX 150',p:2400,a:2023,k:1800,c:'Guayaquil',d:false,v:true},
  {id:'6',n:'Suzuki GN 125',p:1100,a:2020,k:18000,c:'Cuenca',d:false,v:false},
  {id:'7',n:'TVS Ntorq 125',p:1800,a:2021,k:12000,c:'Ambato',d:false,v:false},
  {id:'8',n:'AKT TT 200',p:2100,a:2022,k:9000,c:'Ibarra',d:false,v:true},
]
function Card({l}:{l:typeof L[0]}) {
  const href = '/motos/' + l.id
  return (
    <Link href={href} style={{textDecoration:'none'}}>
      <div style={{background:'#fff',borderRadius:'4px',overflow:'hidden',border:l.d?'1.5px solid #E8390E':'1.5px solid #e8e8e8'}}>
        <div style={{height:'108px',background:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',position:'relative'}}>
          🏍️
          {l.d && <div style={{position:'absolute',top:0,right:0,background:'#E8390E',color:'white',fontSize:'9px',fontWeight:800,padding:'4px 10px'}}>DESTACADA</div>}
          {l.v && <div style={{position:'absolute',bottom:'6px',left:'6px',background:'#1D9E75',color:'white',fontSize:'9px',padding:'2px 7px',borderRadius:'2px'}}>VERIFICADO</div>}
        </div>
        <div style={{padding:'9px 11px'}}>
          <div style={{fontSize:'13px',fontWeight:700,color:'#1E2340',textTransform:'uppercase'}}>{l.n}</div>
          <div style={{fontSize:'18px',fontWeight:800,color:'#E8390E'}}>${l.p.toLocaleString()}</div>
          <div style={{fontSize:'10px',color:'#999',display:'flex',gap:'8px'}}><span>{l.a}</span><span>{l.k.toLocaleString()} km</span><span>{l.c}</span></div>
        </div>
      </div>
    </Link>
  )
}
function Title({text}:{text:string}) {
  return (
    <div style={{display:'flex',alignItems:'center',marginBottom:'16px'}}>
      <div style={{background:'#E8390E',color:'white',fontSize:'13px',fontWeight:800,textTransform:'uppercase',padding:'7px 18px 7px 14px'}}>{text}</div>
      <div style={{flex:1,height:'2px',background:'#e0e0e0'}}></div>
    </div>
  )
}
export default function ListingsGrid() {
  const dest = L.filter(l=>l.d)
  const rec = L.filter(l=>l.d===false)
  return (
    <div style={{background:'#f4f4f4'}}>
      <div style={{padding:'24px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Title text="Clasificado Destacado" />
          <Link href="/motos" style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textDecoration:'none',marginLeft:'12px'}}>Mostrar todo</Link>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:'12px'}}>
          {dest.map(l=><Card key={l.id} l={l}/>)}
        </div>
      </div>
      <div style={{borderTop:'1px solid #e8e8e8'}}></div>
      <div style={{padding:'24px 20px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Title text="Motos Recientes" />
          <Link href="/motos" style={{fontSize:'11px',color:'#E8390E',fontWeight:700,textDecoration:'none',marginLeft:'12px'}}>Ver todas</Link>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:'12px'}}>
          {rec.map(l=><Card key={l.id} l={l}/>)}
        </div>
      </div>
      <div style={{background:'#1E2340',padding:'36px 24px',textAlign:'center'}}>
        <h2 style={{fontSize:'34px',fontWeight:900,color:'#fff',marginBottom:'6px'}}>Vende tu moto con nosotros</h2>
        <p style={{fontSize:'13px',color:'#7a82a0',marginBottom:'22px'}}>Llega a miles de compradores en Ecuador</p>
        <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
          <Link href="/publicar" style={{background:'#E8390E',color:'white',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Publicar mi moto</Link>
          <Link href="/precios" style={{background:'transparent',color:'#fff',border:'2px solid #fff',padding:'13px 32px',fontSize:'13px',fontWeight:800,borderRadius:'3px',textDecoration:'none'}}>Ver planes</Link>
        </div>
      </div>
    </div>
  )
}