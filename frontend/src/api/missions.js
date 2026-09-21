import {get,post} from './client';export const getMissions=()=>get('/api/tasks');export const claimMission=id=>post(`/api/tasks/${id}/claim`);
