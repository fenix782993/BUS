import {useState} from "react";export const useNotifications=()=>{const[n,setN]=useState([]);return{notifications:n,push:x=>setN(v=>[x,...v].slice(0,20)),clear:()=>setN([])}};
