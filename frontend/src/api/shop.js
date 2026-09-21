import {get,post} from './client';export const getShop=()=>get('/api/shop');export const buyItem=id=>post(`/api/shop/${id}/buy`);export const getInventory=()=>get('/api/inventory');
