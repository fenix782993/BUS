import {get,post} from "./client";export const getVehicles=()=>get("/api/vehicles");export const buyVehicle=(player,id)=>post(`/api/player/${player}/vehicle/${id}/buy`);
