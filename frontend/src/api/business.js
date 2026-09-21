import {get,post} from "./client";export const getProperties=()=>get("/api/properties");export const buyProperty=(player,id)=>post(`/api/player/${player}/property/${id}/buy`);
