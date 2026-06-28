import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE  = "service_5zjd20q";
const EMAILJS_TEMPLATE = "template_08vj2xx";
const EMAILJS_KEY      = "Zq_AhXWmfmSKAnUCf";

const CATEGORIAS = ["Tops","Pantalones","Vestidos","Buzos / Camperas","Calzado","Accesorios","Otro"];
const TALLES     = ["XS","S","M","L","XL","XXL","Único","35","36","37","38","39","40","41","42"];
const CONDICIONES= ["Como nuevo","Muy bueno","Bueno"];
const DEPARTAMENTOS = ["Artigas","Canelones","Cerro Largo","Colonia","Durazno","Flores","Florida","Lavalleja","Maldonado","Montevideo","Paysandú","Río Negro","Rivera","Rocha","Salto","San José","Soriano","Tacuarembó","Treinta y Tres"];

const C = {
  bg:"#f7f3ee", bgWarm:"#f0e9e0", card:"#ffffff", border:"#ddd4c5",
  brown:"#2c1a0e", accent:"#b89b7a", accentDark:"#9a7d5e", muted:"#9c8a78",
  green:"#7a9e7a", red:"#c07a6a", sage:"#8a9e82",
};

const serif = "'Georgia', 'Times New Roman', serif";
const sans  = "'Inter', system-ui, sans-serif";

const inp = (extra={}) => ({
  width:"100%", background:C.card, border:`1.5px solid ${C.border}`,
  color:C.brown, borderRadius:8, padding:"12px 14px",
  fontSize:14, boxSizing:"border-box", fontFamily:sans,
  outline:"none", ...extra
});

const Btn = ({ children, onClick, variant="primary", full=false, small=false, disabled=false, style:sx={} }) => {
  const base = {
    border:"none", borderRadius:8, cursor:disabled?"not-allowed":"pointer",
    fontFamily:sans, fontWeight:600, letterSpacing:0.3,
    padding:small?"7px 14px":full?"14px":"11px 22px",
    width:full?"100%":"auto", fontSize:small?12:14,
    opacity:disabled?0.45:1, transition:"opacity 0.2s", ...sx
  };
  const variants = {
    primary:  { background:C.brown,       color:"#fff" },
    secondary:{ background:"transparent", color:C.brown, border:`1.5px solid ${C.border}` },
    accent:   { background:C.accent,      color:"#fff" },
    ghost:    { background:"transparent", color:C.muted, border:`1.5px solid ${C.border}` },
    danger:   { background:C.red,         color:"#fff" },
    success:  { background:C.green,       color:"#fff" },
    sage:     { background:C.sage,        color:"#fff" },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Badge = ({ text, color }) => (
  <span style={{ display:"inline-block", background:color+"22", color, borderRadius:99, padding:"3px 11px", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>{text}</span>
);

function fmt(n){ return "$" + Math.round(n).toLocaleString("es-UY"); }

const Divider = () => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
    <div style={{ flex:1, height:1, background:C.border }}/>
    <span style={{ color:C.accent, fontSize:12 }}>♡</span>
    <div style={{ flex:1, height:1, background:C.border }}/>
  </div>
);

const HeaderPublico = () => (
  <div style={{ background:C.bg, borderBottom:`1px solid ${C.border}`, padding:"28px 20px 0", textAlign:"center" }}>
    <div style={{ maxWidth:560, margin:"0 auto" }}>
      <p style={{ margin:"0 0 4px", fontSize:10, color:C.muted, letterSpacing:4, textTransform:"uppercase", fontFamily:sans }}>· second hand ·</p>
      <h1 style={{ margin:"0 0 4px", fontSize:36, fontWeight:700, color:C.brown, fontFamily:serif, letterSpacing:-0.5 }}>El Ropero</h1>
      <p style={{ margin:"0 0 20px", fontSize:13, color:C.muted, fontStyle:"italic", fontFamily:serif }}>Ropa con historia, precios sin drama</p>
      <Divider/>
      <p style={{ margin:"12px 0 0", fontSize:12, color:C.muted, fontFamily:sans }}>Encontrá tu próxima prenda favorita 🌿</p>
      <div style={{ height:20 }}/>
    </div>
  </div>
);

function Galeria({ imgs, nombre }){
  const [idx, setIdx] = useState(0);
  const [startX, setStartX] = useState(null);
  const prev = () => setIdx(i => (i-1+imgs.length)%imgs.length);
  const next = () => setIdx(i => (i+1)%imgs.length);
  const onTouchStart = (e) => setStartX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if(startX===null) return;
    const diff = startX - e.changedTouches[0].clientX;
    if(diff > 40) next(); else if(diff < -40) prev();
    setStartX(null);
  };
  return (
    <div style={{ position:"relative", userSelect:"none" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img src={imgs[idx]} alt={nombre} style={{ width:"100%", height:280, objectFit:"cover", display:"block" }}/>
      {imgs.length > 1 && (
        <>
          <button onClick={prev} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", background:"#00000055", border:"none", color:"#fff", borderRadius:99, width:32, height:32, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <button onClick={next} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"#00000055", border:"none", color:"#fff", borderRadius:99, width:32, height:32, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          <div style={{ position:"absolute", bottom:10, left:0, right:0, display:"flex", justifyContent:"center", gap:5 }}>
            {imgs.map((_,i)=>(
              <div key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?18:6, height:6, borderRadius:99, background:i===idx?"#fff":"#ffffff88", cursor:"pointer", transition:"width 0.2s" }}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FormCompra({ p, onComprar, onCancelar }){
  const [form, setForm] = useState({
    nombre:"", tel:"", metodo_pago:"efectivo",
    tipo_entrega:"retira", departamento:"", direccion:""
  });
  const [enviando, setEnviando] = useState(false);
  const f = (k,v) => setForm(prev=>({...prev,[k]:v}));
  const ok = form.nombre.trim() && form.tel.trim() && (form.tipo_entrega==="retira" || (form.departamento && form.direccion.trim()));

  const confirmar = async () => {
    if(!ok||enviando) return;
    setEnviando(true);
    await onComprar(p, form);
    setEnviando(false);
  };

  return (
    <div style={{ background:C.bgWarm, borderRadius:12, padding:16, border:`1px solid ${C.border}` }}>
      <p style={{ margin:"0 0 14px", fontSize:15, fontWeight:600, color:C.brown, fontFamily:serif }}>Datos de compra</p>

      <div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 4px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Nombre *</p>
        <input placeholder="Tu nombre" value={form.nombre} onChange={e=>f("nombre",e.target.value)} style={inp()}/>
      </div>

      <div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 4px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Teléfono *</p>
        <input placeholder="Tu teléfono" type="tel" value={form.tel} onChange={e=>f("tel",e.target.value)} style={inp()}/>
      </div>

      <div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 8px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Método de pago</p>
        <div style={{ display:"flex", gap:8 }}>
          {[["efectivo","Efectivo"],["transferencia","Transferencia"]].map(([val,label])=>(
            <button key={val} onClick={()=>f("metodo_pago",val)} style={{ flex:1, background:form.metodo_pago===val?C.brown:C.card, border:`1.5px solid ${form.metodo_pago===val?C.brown:C.border}`, color:form.metodo_pago===val?"#fff":C.muted, borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <p style={{ margin:"0 0 8px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Entrega</p>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[["retira","Retiro en local"],["envio","Envío"]].map(([val,label])=>(
            <button key={val} onClick={()=>f("tipo_entrega",val)} style={{ flex:1, background:form.tipo_entrega===val?C.brown:C.card, border:`1.5px solid ${form.tipo_entrega===val?C.brown:C.border}`, color:form.tipo_entrega===val?"#fff":C.muted, borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>{label}</button>
          ))}
        </div>
        {form.tipo_entrega==="envio" && (
          <>
            <select value={form.departamento} onChange={e=>f("departamento",e.target.value)} style={{ ...inp(), marginBottom:8 }}>
              <option value="">Seleccioná tu departamento</option>
              {DEPARTAMENTOS.map(d=><option key={d}>{d}</option>)}
            </select>
            <input placeholder="Dirección completa" value={form.direccion} onChange={e=>f("direccion",e.target.value)} style={inp()}/>
          </>
        )}
      </div>

      <div style={{ display:"flex", gap:8, marginTop:14 }}>
        <Btn variant="ghost" onClick={onCancelar}>Cancelar</Btn>
        <button onClick={confirmar} disabled={!ok||enviando} style={{ flex:1, background:ok&&!enviando?C.brown:"#ccc", color:"#fff", border:"none", borderRadius:8, padding:"11px", fontSize:14, fontWeight:600, cursor:ok&&!enviando?"pointer":"not-allowed", fontFamily:sans }}>
          {enviando ? "Procesando..." : "Confirmar compra"}
        </button>
      </div>
    </div>
  );
}

function CardCliente({ p, onReservar, onComprar }){
  const [modo, setModo]     = useState(null); // null | "reservar" | "comprar"
  const [form, setForm]     = useState({ nombre:"", cel:"" });
  const [listo, setListo]   = useState(false);
  const [detalle, setDetalle] = useState(false);

  const confirmarReserva = () => {
    if(!form.nombre.trim()||!form.cel.trim()) return;
    onReservar(p.id, form);
    setListo(true); setModo(null);
  };

  const confirmarCompra = async (prenda, datos) => {
    await onComprar(prenda, datos);
    setListo(true); setModo(null);
  };

  const imgs = p.fotos?.length ? p.fotos : [];

  return (
    <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:20, boxShadow:"0 2px 12px #0000000a" }}>
      {imgs.length === 0
        ? <div style={{ width:"100%", height:200, background:C.bgWarm, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
            <span style={{ fontSize:48 }}>👗</span>
            <span style={{ fontSize:12, color:C.muted, fontFamily:sans }}>Sin foto</span>
          </div>
        : <Galeria imgs={imgs} nombre={p.nombre}/>
      }
      <div style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:C.brown, fontFamily:serif, lineHeight:1.3, flex:1, marginRight:12 }}>{p.nombre}</h2>
          <p style={{ margin:0, fontSize:20, fontWeight:700, color:C.accent, fontFamily:serif, flexShrink:0 }}>{fmt(p.precio)}</p>
        </div>
        <p style={{ margin:"0 0 10px", fontSize:13, color:C.muted, fontFamily:sans }}>{p.categoria} · Talle {p.talle} · {p.condicion}</p>
        {p.descripcion && (
          <p style={{ margin:"0 0 14px", fontSize:14, color:C.muted, lineHeight:1.7, fontFamily:sans }}>
            {detalle ? p.descripcion : p.descripcion.slice(0,80)+(p.descripcion.length>80?"...":"")}
            {p.descripcion.length>80 && <span onClick={()=>setDetalle(!detalle)} style={{ color:C.accent, cursor:"pointer", marginLeft:4, fontWeight:600 }}>{detalle?"ver menos":"ver más"}</span>}
          </p>
        )}

        {listo
          ? <div style={{ background:C.bgWarm, borderRadius:10, padding:14, textAlign:"center", border:`1px solid ${C.border}` }}>
              <p style={{ margin:0, fontSize:14, color:C.sage, fontWeight:600, fontFamily:sans }}>✓ ¡Gracias! Nos contactamos pronto 🌿</p>
            </div>
          : modo===null
            ? <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setModo("reservar")} style={{ flex:1, background:"transparent", border:`1.5px solid ${C.brown}`, color:C.brown, borderRadius:8, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:sans }}>Reservar</button>
                <button onClick={()=>setModo("comprar")} style={{ flex:1, background:C.brown, border:"none", color:"#fff", borderRadius:8, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:sans }}>Comprar</button>
              </div>
            : modo==="reservar"
              ? <div style={{ background:C.bgWarm, borderRadius:12, padding:16, border:`1px solid ${C.border}` }}>
                  <p style={{ margin:"0 0 14px", fontSize:15, fontWeight:600, color:C.brown, fontFamily:serif }}>Tus datos</p>
                  <input placeholder="Tu nombre" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={{ ...inp(), marginBottom:8 }}/>
                  <input placeholder="Tu celular" type="tel" value={form.cel} onChange={e=>setForm(f=>({...f,cel:e.target.value}))} style={{ ...inp(), marginBottom:14 }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn variant="ghost" onClick={()=>setModo(null)}>Cancelar</Btn>
                    <button onClick={confirmarReserva} style={{ flex:1, background:C.brown, color:"#fff", border:"none", borderRadius:8, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:sans }}>Confirmar reserva</button>
                  </div>
                </div>
              : <FormCompra p={p} onComprar={confirmarCompra} onCancelar={()=>setModo(null)}/>
        }
      </div>
    </div>
  );
}

function VistaCliente({ prendas, onReservar, onComprar }){
  const [filtros, setFiltros] = useState({ cat:"", talle:"" });
  const visibles = prendas.filter(p => {
    if(p.estado !== "publicada") return false;
    if(filtros.cat && p.categoria !== filtros.cat) return false;
    if(filtros.talle && p.talle !== filtros.talle) return false;
    return true;
  });
  return (
    <div style={{ background:C.bg, minHeight:"100vh" }}>
      <HeaderPublico/>
      <div style={{ maxWidth:560, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          <select value={filtros.cat} onChange={e=>setFiltros(f=>({...f,cat:e.target.value}))} style={{ ...inp({ width:"auto", padding:"8px 12px", fontSize:13 }) }}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
          </select>
          <select value={filtros.talle} onChange={e=>setFiltros(f=>({...f,talle:e.target.value}))} style={{ ...inp({ width:"auto", padding:"8px 12px", fontSize:13 }) }}>
            <option value="">Todos los talles</option>
            {TALLES.map(t=><option key={t}>{t}</option>)}
          </select>
          {(filtros.cat||filtros.talle) && <Btn variant="ghost" small onClick={()=>setFiltros({cat:"",talle:""})}>✕ Limpiar</Btn>}
        </div>
        {visibles.length===0
          ? <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
              <p style={{ fontFamily:serif, fontSize:18, color:C.brown, margin:"0 0 8px" }}>No hay prendas disponibles</p>
              <p style={{ fontFamily:sans, fontSize:13, color:C.muted }}>Volvé pronto, ¡siempre llegan novedades!</p>
            </div>
          : visibles.map(p=><CardCliente key={p.id} p={p} onReservar={onReservar} onComprar={onComprar}/>)
        }
        <div style={{ textAlign:"center", padding:"30px 0 10px" }}>
          <Divider/>
          <p style={{ fontFamily:serif, fontSize:12, color:C.muted, fontStyle:"italic", marginTop:12 }}>El Ropero · Second Hand 🌿</p>
        </div>
      </div>
    </div>
  );
}

async function subirFotos(archivos) {
  const urls = [];
  for (const archivo of archivos) {
    if (archivo.startsWith('http')) { urls.push(archivo); continue; }
    const blob = await fetch(archivo).then(r => r.blob());
    const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage.from('fotos').upload(nombre, blob, { contentType: 'image/jpeg' });
    if (!error) {
      const { data } = supabase.storage.from('fotos').getPublicUrl(nombre);
      urls.push(data.publicUrl);
    }
  }
  return urls;
}

function FormPrenda({ inicial, onGuardar, onCancelar }){
  const vacio = { nombre:"", vendedora:"", categoria:CATEGORIAS[0], talle:TALLES[0], condicion:CONDICIONES[0], precio:"", descripcion:"", fotos:[], estado:"borrador" };
  const [form, setForm] = useState(inicial || vacio);
  const [fotos, setFotos] = useState(inicial?.fotos || []);
  const [guardando, setGuardando] = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const ok = form.nombre.trim() && form.vendedora.trim() && form.precio;

  const handleFotos = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - fotos.length;
    files.slice(0, remaining).forEach(file => {
      const r = new FileReader();
      r.onload = ev => setFotos(prev => [...prev, ev.target.result].slice(0,5));
      r.readAsDataURL(file);
    });
  };

  const handleGuardar = async () => {
    if (!ok || guardando) return;
    setGuardando(true);
    const urlsFotos = await subirFotos(fotos);
    onGuardar({ ...form, precio: parseFloat(form.precio), fotos: urlsFotos });
    setGuardando(false);
  };

  return (
    <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
      <h3 style={{ margin:"0 0 18px", fontFamily:serif, fontSize:18, color:C.brown }}>{inicial ? "Editar prenda" : "Nueva prenda"}</h3>
      {[["Nombre de la prenda *","nombre","text","Ej: Vestido floral verde"],
        ["Tu nombre (vendedora) *","vendedora","text","Ej: Sofi"],
        ["Precio ($) *","precio","number","Ej: 350"]].map(([label,key,type,ph])=>(
        <div key={key} style={{ marginBottom:14 }}>
          <p style={{ margin:"0 0 5px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</p>
          <input type={type} placeholder={ph} value={form[key]} onChange={e=>f(key,e.target.value)} style={inp()}/>
        </div>
      ))}
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[["Categoría","categoria",CATEGORIAS],["Talle","talle",TALLES]].map(([label,key,opts])=>(
          <div key={key} style={{ flex:1 }}>
            <p style={{ margin:"0 0 5px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</p>
            <select value={form[key]} onChange={e=>f(key,e.target.value)} style={inp()}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:14 }}>
        <p style={{ margin:"0 0 8px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Condición</p>
        <div style={{ display:"flex", gap:8 }}>
          {CONDICIONES.map(c=>(
            <button key={c} onClick={()=>f("condicion",c)} style={{ flex:1, background:form.condicion===c?C.brown:C.card, border:`1.5px solid ${form.condicion===c?C.brown:C.border}`, color:form.condicion===c?"#fff":C.muted, borderRadius:8, padding:"10px 4px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <p style={{ margin:"0 0 5px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Descripción</p>
        <textarea placeholder="Color, tela, detalles..." value={form.descripcion} onChange={e=>f("descripcion",e.target.value)} style={{ ...inp(), height:80, resize:"vertical" }}/>
      </div>
      <div style={{ marginBottom:20 }}>
        <p style={{ margin:"0 0 5px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Fotos (máx. 5)</p>
        <div style={{ border:`1.5px dashed ${C.border}`, borderRadius:10, padding:16, background:C.bgWarm }}>
          {fotos.length < 5 && <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ fontSize:13, color:C.muted, fontFamily:sans, marginBottom:fotos.length>0?12:0 }}/>}
          {fotos.length === 0 && <p style={{ margin:"8px 0 0", fontSize:12, color:C.muted, fontFamily:sans }}>JPG o PNG · fondo claro recomendado · hasta 5 fotos</p>}
          {fotos.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
              {fotos.map((src,i)=>(
                <div key={i} style={{ position:"relative", width:80, height:80 }}>
                  <img src={src} alt={`foto ${i+1}`} style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:`2px solid ${i===0?C.accent:C.border}` }}/>
                  {i===0 && <span style={{ position:"absolute", bottom:2, left:2, background:C.accent, color:"#fff", fontSize:9, borderRadius:4, padding:"1px 4px", fontFamily:sans }}>Principal</span>}
                  <button onClick={()=>setFotos(prev=>prev.filter((_,j)=>j!==i))} style={{ position:"absolute", top:-4, right:-4, background:C.red, border:"none", color:"#fff", borderRadius:99, width:18, height:18, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <p style={{ margin:"0 0 8px", fontSize:12, color:C.muted, fontWeight:600, fontFamily:sans, textTransform:"uppercase", letterSpacing:0.5 }}>Estado</p>
        <div style={{ display:"flex", gap:8 }}>
          {[["borrador","Borrador"],["publicada","Publicada"]].map(([val,label])=>(
            <button key={val} onClick={()=>f("estado",val)} style={{ flex:1, background:form.estado===val?C.brown:C.card, border:`1.5px solid ${form.estado===val?C.brown:C.border}`, color:form.estado===val?"#fff":C.muted, borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn variant="ghost" onClick={onCancelar}>Cancelar</Btn>
        <button onClick={handleGuardar} disabled={!ok||guardando} style={{ flex:1, background:ok&&!guardando?C.brown:"#ccc", color:"#fff", border:"none", borderRadius:8, padding:"12px", fontSize:14, fontWeight:600, cursor:ok&&!guardando?"pointer":"not-allowed", fontFamily:sans }}>
          {guardando ? "Guardando..." : "Guardar prenda"}
        </button>
      </div>
    </div>
  );
}

function PanelAdmin({ prendas, onGuardar, onEliminar, onCambiarEstado, onSalir }){
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const filtradas = prendas.filter(p=>{
    if(filtro==="borradores") return p.estado==="borrador";
    if(filtro==="publicadas") return p.estado==="publicada";
    if(filtro==="reservadas") return p.estado==="reservada";
    if(filtro==="en_proceso") return p.estado==="en_proceso";
    return true;
  });
  const guardar = (data) => { onGuardar(editando==="nueva" ? data : { ...prendas.find(p=>p.id===editando), ...data }); setEditando(null); };
  if(editando!==null){
    const inicial = editando==="nueva" ? null : prendas.find(p=>p.id===editando);
    return (
      <div style={{ background:C.bg, minHeight:"100vh", padding:"20px 16px" }}>
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <button onClick={()=>setEditando(null)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, fontFamily:sans, marginBottom:16, padding:0 }}>← Volver al panel</button>
          <FormPrenda inicial={inicial} onGuardar={guardar} onCancelar={()=>setEditando(null)}/>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background:C.bg, minHeight:"100vh" }}>
      <div style={{ background:C.brown, padding:"20px 20px 0" }}>
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <p style={{ margin:0, fontSize:10, color:"#ffffff66", letterSpacing:3, textTransform:"uppercase", fontFamily:sans }}>panel de gestión</p>
              <h2 style={{ margin:"2px 0 0", fontSize:22, fontWeight:700, color:"#fff", fontFamily:serif }}>El Ropero</h2>
            </div>
            <Btn variant="ghost" small onClick={onSalir} style={{ color:"#fff", borderColor:"#ffffff44" }}>Salir</Btn>
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:16 }}>
            {[[prendas.length,"Total"],[prendas.filter(p=>p.estado==="publicada").length,"Publicadas"],[prendas.filter(p=>p.estado==="borrador").length,"Borradores"],[prendas.filter(p=>p.estado==="reservada").length,"Reservadas"],[prendas.filter(p=>p.estado==="en_proceso").length,"En proceso"]].map(([n,label])=>(
              <div key={label} style={{ flex:1, background:"#ffffff18", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                <p style={{ margin:0, fontSize:20, fontWeight:800, color:"#fff", fontFamily:serif }}>{n}</p>
                <p style={{ margin:0, fontSize:10, color:"#ffffff88", fontFamily:sans }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:0, borderTop:"1px solid #ffffff22" }}>
            {[["todas","Todas"],["publicadas","Publicadas"],["borradores","Borradores"],["reservadas","Reservadas"],["en_proceso","En proceso"]].map(([key,label])=>(
              <button key={key} onClick={()=>setFiltro(key)} style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 12px", fontSize:12, fontWeight:600, fontFamily:sans, color:filtro===key?"#fff":"#ffffff66", borderBottom:filtro===key?`2px solid ${C.accent}`:"2px solid transparent" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth:560, margin:"0 auto", padding:"20px 16px" }}>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
          <Btn variant="primary" onClick={()=>setEditando("nueva")}>+ Nueva prenda</Btn>
        </div>
        {filtradas.length===0
          ? <div style={{ textAlign:"center", padding:"60px 0", color:C.muted }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📦</div>
              <p style={{ fontFamily:serif, fontSize:16, color:C.brown }}>No hay prendas aquí</p>
              <Btn variant="accent" onClick={()=>setEditando("nueva")} style={{ marginTop:16 }}>Agregar la primera</Btn>
            </div>
          : filtradas.map(p=>(
            <div key={p.id} style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:12, boxShadow:"0 1px 6px #0000000a" }}>
              <div style={{ display:"flex" }}>
                {p.fotos?.[0]
                  ? <img src={p.fotos[0]} alt={p.nombre} style={{ width:88, height:88, objectFit:"cover", flexShrink:0 }}/>
                  : <div style={{ width:88, height:88, background:C.bgWarm, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:28 }}>👗</span></div>
                }
                <div style={{ padding:"10px 14px", flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:700, color:C.brown, fontFamily:serif, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.nombre}</p>
                  <p style={{ margin:"0 0 6px", fontSize:12, color:C.muted, fontFamily:sans }}>Talle {p.talle} · {fmt(p.precio)} · {p.vendedora}</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {p.estado==="borrador"   && <Badge text="Borrador"    color={C.muted}/>}
                    {p.estado==="publicada"  && <Badge text="Publicada"   color={C.sage}/>}
                    {p.estado==="reservada"  && <Badge text="Reservada"   color={C.accent}/>}
                    {p.estado==="en_proceso" && <Badge text="En proceso"  color={C.brown}/>}
                    {p.estado==="vendida"    && <Badge text="Vendida"     color={C.green}/>}
                  </div>
                </div>
              </div>
              {p.reserva_nombre && (
                <div style={{ padding:"9px 14px", background:C.bgWarm, borderTop:`1px solid ${C.border}` }}>
                  <p style={{ margin:0, fontSize:13, color:C.accent, fontWeight:600, fontFamily:sans }}>📩 {p.reserva_nombre} · {p.reserva_cel}</p>
                </div>
              )}
              {p.comprador_nombre && (
                <div style={{ padding:"9px 14px", background:C.bgWarm, borderTop:`1px solid ${C.border}` }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, color:C.brown, fontWeight:600, fontFamily:sans }}>🛍️ {p.comprador_nombre} · {p.comprador_tel}</p>
                  <p style={{ margin:0, fontSize:12, color:C.muted, fontFamily:sans }}>{p.metodo_pago} · {p.tipo_entrega==="retira"?"Retira en local":`Envío a ${p.departamento} - ${p.direccion}`}</p>
                </div>
              )}
              <div style={{ padding:"10px 14px", display:"flex", gap:8, flexWrap:"wrap", borderTop:`1px solid ${C.border}`, background:C.bgWarm }}>
                <Btn variant="secondary" small onClick={()=>setEditando(p.id)}>✏️ Editar</Btn>
                {p.estado!=="publicada"  && <Btn variant="sage"    small onClick={()=>onCambiarEstado(p.id,"publicada")}>Publicar</Btn>}
                {p.estado!=="borrador"   && <Btn variant="ghost"   small onClick={()=>onCambiarEstado(p.id,"borrador")}>Borrador</Btn>}
                {p.estado==="publicada"  && <Btn variant="accent"  small onClick={()=>onCambiarEstado(p.id,"reservada")}>Reservada</Btn>}
                {p.estado!=="vendida"    && <Btn variant="success"  small onClick={()=>onCambiarEstado(p.id,"vendida")}>Vendida ✓</Btn>}
                <Btn variant="danger" small onClick={()=>onEliminar(p.id)}>Eliminar</Btn>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function LoginAdmin({ onLogin, onVolver }){
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const intentar = async () => {
    if(!email||!pass) return;
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if(error){ setErr("Email o contraseña incorrectos"); setPass(""); }
    else { onLogin(); }
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, borderRadius:20, padding:32, border:`1px solid ${C.border}`, maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px #0000000f" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <h2 style={{ margin:"0 0 4px", fontFamily:serif, fontSize:22, color:C.brown }}>Área de vendedoras</h2>
        <p style={{ margin:"0 0 24px", fontFamily:sans, fontSize:13, color:C.muted }}>Ingresá con tu cuenta para continuar</p>
        <input type="email" placeholder="Email" value={email} onChange={e=>{ setEmail(e.target.value); setErr(""); }} style={{ ...inp(), marginBottom:8 }}/>
        <input type="password" placeholder="Contraseña" value={pass} onChange={e=>{ setPass(e.target.value); setErr(""); }} onKeyDown={e=>e.key==="Enter"&&intentar()} style={{ ...inp(), marginBottom:10 }}/>
        {err && <p style={{ margin:"0 0 10px", fontSize:13, color:C.red, fontFamily:sans }}>{err}</p>}
        <Btn variant="primary" full onClick={intentar} disabled={loading}>{loading?"Ingresando...":"Entrar"}</Btn>
        <button onClick={onVolver} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13, fontFamily:sans, marginTop:16, display:"block", width:"100%" }}>← Volver al catálogo</button>
      </div>
    </div>
  );
}

export default function App(){
  const [vista, setVista]     = useState("catalogo");
  const [prendas, setPrendas] = useState([]);
  const [adminOk, setAdminOk] = useState(false);

  useEffect(() => {
    cargarPrendas();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if(session) setAdminOk(true);
    });
  }, []);

  const cargarPrendas = async () => {
    const { data } = await supabase.from('prendas').select('*').order('created_at', { ascending: false });
    if(data) setPrendas(data);
  };

  const upsertPrenda = async (data) => {
    if(data.id){
      await supabase.from('prendas').update({ ...data }).eq('id', data.id);
    } else {
      await supabase.from('prendas').insert([{ ...data }]);
    }
    cargarPrendas();
  };

  const eliminar = async (id) => {
    if(!window.confirm("¿Eliminar esta prenda?")) return;
    await supabase.from('prendas').delete().eq('id', id);
    cargarPrendas();
  };

  const cambiarEstado = async (id, estado) => {
    await supabase.from('prendas').update({ estado }).eq('id', id);
    cargarPrendas();
  };

  const reservar = async (id, datos) => {
    await supabase.from('prendas').update({ estado:"reservada", reserva_nombre: datos.nombre, reserva_cel: datos.cel }).eq('id', id);
    cargarPrendas();
  };

  const comprar = async (prenda, datos) => {
    await supabase.from('prendas').update({
      estado: "en_proceso",
      comprador_nombre: datos.nombre,
      comprador_tel: datos.tel,
      metodo_pago: datos.metodo_pago,
      tipo_entrega: datos.tipo_entrega,
      departamento: datos.departamento || null,
      direccion: datos.direccion || null,
    }).eq('id', prenda.id);

    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      prenda_nombre: prenda.nombre,
      prenda_precio: fmt(prenda.precio),
      vendedora: prenda.vendedora,
      comprador_nombre: datos.nombre,
      comprador_tel: datos.tel,
      metodo_pago: datos.metodo_pago,
      tipo_entrega: datos.tipo_entrega === "retira" ? "Retira en local" : "Envío",
      departamento: datos.departamento || "N/A",
      direccion: datos.direccion || "N/A",
    }, EMAILJS_KEY);

    cargarPrendas();
  };

  const onLogin = () => { setAdminOk(true); setVista("admin"); };
  const onSalir = async () => { await supabase.auth.signOut(); setAdminOk(false); setVista("catalogo"); };

  const BtnVendedoras = () => (
    <button onClick={()=>setVista(adminOk?"admin":"login")}
      onMouseEnter={e=>e.currentTarget.style.opacity="0.5"}
      onMouseLeave={e=>e.currentTarget.style.opacity="0.1"}
      style={{ position:"fixed", bottom:10, right:14, background:"transparent", border:"none", color:C.muted, fontSize:18, cursor:"default", opacity:0.1, zIndex:100, padding:"4px", userSelect:"none", lineHeight:1 }}>·</button>
  );

  if(vista==="login") return <LoginAdmin onLogin={onLogin} onVolver={()=>setVista("catalogo")}/>;
  if(vista==="admin" && adminOk) return <PanelAdmin prendas={prendas} onGuardar={upsertPrenda} onEliminar={eliminar} onCambiarEstado={cambiarEstado} onSalir={onSalir}/>;

  return (
    <>
      <VistaCliente prendas={prendas} onReservar={reservar} onComprar={comprar}/>
      <BtnVendedoras/>
    </>
  );
}
