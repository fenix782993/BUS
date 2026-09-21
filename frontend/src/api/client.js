const API=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
export async function api(path,options={}){const token=localStorage.getItem('fenix_token');const headers={'Content-Type':'application/json',...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;const r=await fetch(API+path,{...options,headers});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.detail||`API ${r.status}`);return d}
export const get=p=>api(p);export const post=(p,b={})=>api(p,{method:'POST',body:JSON.stringify(b)});
