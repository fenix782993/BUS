import {useAsync} from "./useAsync";import {getInventory} from "../api/shop";export const useInventory=()=>useAsync(getInventory,[]);
