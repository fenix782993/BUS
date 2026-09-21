import {createContext,useContext,useMemo,useState} from "react";
const UI=createContext(null);
export function UIProvider({children}){const [toast,setToast]=useState(null);const notify=(message,type="info")=>{setToast({message,type});setTimeout(()=>setToast(null),2600)};const value=useMemo(()=>({notify}),[]);return <UI.Provider value={value}>{children}{toast&&<div className={`toast ${toast.type}`}>{toast.message}</div>}</UI.Provider>}
export const useUI=()=>useContext(UI);
