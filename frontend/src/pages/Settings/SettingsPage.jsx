import {useEffect,useState} from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
export default function SettingsPage(){
 const [compact,setCompact]=useState(localStorage.getItem('fenix_compact')==='1'); const [motion,setMotion]=useState(localStorage.getItem('fenix_motion')!=='0');
 useEffect(()=>{document.body.classList.toggle('compact',compact);document.body.classList.toggle('no-motion',!motion);localStorage.setItem('fenix_compact',compact?'1':'0');localStorage.setItem('fenix_motion',motion?'1':'0')},[compact,motion]);
 function logout(){localStorage.removeItem('fenix_token');location.reload()}
 return <><PageHeader title="Настройки" subtitle="Параметры интерфейса и аккаунта."/><div className="two"><Card><h2>Интерфейс</h2><label className="setting"><span>Компактный режим</span><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/></label><label className="setting"><span>Анимации</span><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/></label></Card><Card><h2>Аккаунт</h2><button className="danger" onClick={logout}>Выйти из аккаунта</button></Card></div></>
}
