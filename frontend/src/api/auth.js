import {post} from './client';export const login=(nickname,password)=>post('/api/login',{nickname,password});export const register=(nickname,password)=>post('/api/register',{nickname,password});
