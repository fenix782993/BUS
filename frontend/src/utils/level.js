export const levelProgress=(xp,next)=>Math.min(100,Math.max(0,(xp/Math.max(1,next))*100));
