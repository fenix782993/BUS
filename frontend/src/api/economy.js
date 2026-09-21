import {get} from "./client";export const getPackages=()=>get("/api/donations/packages");export const getVip=()=>get("/api/vip");
