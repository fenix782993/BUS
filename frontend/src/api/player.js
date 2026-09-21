import {get,post} from './client';
export const getMe=()=>get('/api/me');
export const work=id=>post(`/api/player/${id}/action`,{action:'work'});
export const rest=id=>post(`/api/player/${id}/rest`);
