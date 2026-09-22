import {useState} from 'react';
import {NAV} from '../../data/navigation';
import {Menu,X} from 'lucide-react';

export default function MobileNav({page,setPage,player}){
  const [open,setOpen]=useState(false);
  const items=NAV.filter(x=>!x.admin||player?.role==='admin'||player?.nickname==='FENIX');
  const main=items.slice(0,4);
  function go(id){setPage(id);setOpen(false)}
  return <>
    {open&&<div className="mobile-menu-backdrop" onClick={()=>setOpen(false)}>
      <div className="mobile-menu" onClick={e=>e.stopPropagation()}>
        <div className="mobile-menu-head"><b>FENIX CITY</b><button onClick={()=>setOpen(false)}><X size={20}/></button></div>
        <div className="mobile-menu-grid">
          {items.map(({id,label,icon:Icon})=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={19}/><span>{label}</span></button>)}
        </div>
      </div>
    </div>}
    <div className="mobile">
      {main.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} onClick={()=>go(id)}><Icon size={19}/><span>{label}</span></button>)}
      <button className={open?'active':''} onClick={()=>setOpen(v=>!v)}><Menu size={19}/><span>Ещё</span></button>
    </div>
  </>
}
