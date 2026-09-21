import {useEffect,useState} from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import {get,post} from '../../api/client';
export default function VipPage({refresh}){
 const [data,setData]=useState({current:'FREE',tiers:[]}); useEffect(()=>{get('/api/vip').then(setData)},[]);
 async function buy(name){try{await post('/api/vip/purchase',{tier:name});alert(`Активирован ${name}`);refresh?.();const d=await get('/api/vip');setData(d)}catch(e){alert(e.message)}}
 return <><PageHeader title="VIP" subtitle={`Текущий статус: ${data.current}`}/><div className="cards">{data.tiers.map(t=><Card key={t.name} className={data.current===t.name?'vip-active':''}><span className="badge">VIP</span><h2>{t.name}</h2><strong>{t.price} FC</strong><p>{t.bonus}</p><button disabled={data.current===t.name} onClick={()=>buy(t.name)}>{data.current===t.name?'Активен':'Активировать'}</button></Card>)}</div></>
}
