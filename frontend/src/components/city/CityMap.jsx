import {useMemo,useState} from 'react';
import {Building2,CarFront,Factory,Plane,Ship,Star,MapPin} from 'lucide-react';

const ICONS={business:Building2,industrial:Factory,premium:Star,waterfront:Ship,oldtown:MapPin,airport:Plane};
const POSITIONS={
  1:{x:42,y:34,w:24,h:25},2:{x:12,y:42,w:25,h:30},3:{x:65,y:12,w:24,h:27},
  4:{x:65,y:55,w:27,h:27},5:{x:35,y:63,w:24,h:23},6:{x:8,y:10,w:23,h:23}
};
export default function CityMap({districts=[]}){
 const [selected,setSelected]=useState(districts[0]?.id||1);
 const current=useMemo(()=>districts.find(x=>x.id===selected)||districts[0],[districts,selected]);
 return <div className="city-map-wrap">
   <div className="city-map-head"><div><span className="eyebrow">LIVE CITY MAP</span><h2>Карта FENIX CITY</h2><p className="muted">Выбирай район и смотри, чем он живёт.</p></div><div className="map-legend"><span><i className="legend-dot hot"/>Активный</span><span><i className="legend-dot"/>Район</span></div></div>
   <div className="city-map">
     <div className="map-water water-a"/><div className="map-water water-b"/>
     <div className="map-road road-a"/><div className="map-road road-b"/><div className="map-road road-c"/><div className="map-road road-d"/>
     {districts.map(d=>{const P=POSITIONS[d.id]||{x:10,y:10,w:20,h:20};const Icon=ICONS[d.type]||MapPin;return <button key={d.id} className={`district-pin ${selected===d.id?'selected':''}`} style={{left:`${P.x}%`,top:`${P.y}%`,width:`${P.w}%`,height:`${P.h}%`}} onClick={()=>setSelected(d.id)}><span className="district-icon"><Icon size={20}/></span><strong>{d.name}</strong><small>{d.activity}% активности</small></button>})}
     <div className="map-label label-north">N</div><div className="map-label label-south">S</div>
   </div>
   {current&&<div className="map-detail"><div className="map-detail-icon"><MapPin size={22}/></div><div><span className="badge">{current.type}</span><h3>{current.name}</h3><p>{current.description}</p></div><div className="map-detail-stat"><strong>{current.activity}%</strong><span>активность</span></div></div>}
 </div>
}
