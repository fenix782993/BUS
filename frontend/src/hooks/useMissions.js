import {useAsync} from "./useAsync";import {getMissions} from "../api/missions";export const useMissions=()=>useAsync(getMissions,[]);
