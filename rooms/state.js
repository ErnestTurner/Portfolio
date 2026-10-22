export const STORAGE_KEY = 'trikzik-twelve-rooms-preview-v1';
export const ROOM_IDS = ['hall','workbench','museum','library','observatory','specimens','soft','mirrors','traffic','conservatory','counterweight','portal'];
export function initialState() { return {visited:['hall'],rain:0,hallWater:0,gardenDrained:false,clouds:1,plant:0,portalGift:false,lamp:50,lightRoute:'amber',draft:{stamp:'orbit',strokes:[]},art:{stamp:'orbit',strokes:[]},exhibited:false,paused:false}; }
const bounded=(n,lo,hi,fallback)=>Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):fallback;
export function cleanArt(value) {
  return {stamp:['orbit','sprout','spark'].includes(value?.stamp)?value.stamp:'orbit',strokes:Array.isArray(value?.strokes)?value.strokes.slice(0,30).filter(Array.isArray).map(s=>s.slice(0,250).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).map(([x,y])=>[bounded(x,0,600,0),bounded(y,0,330,0)])):[]};
}
export function validateState(raw) {
  const base=initialState();if(!raw||typeof raw!=='object')return base;
  return {...base,visited:Array.isArray(raw.visited)?[...new Set(raw.visited.filter(x=>ROOM_IDS.includes(x)))]:base.visited,rain:bounded(raw.rain,0,100,0),hallWater:bounded(raw.hallWater,0,100,0),gardenDrained:raw.gardenDrained===true,clouds:Math.round(bounded(raw.clouds,0,3,1)),plant:Math.round(bounded(raw.plant,0,2,0)),portalGift:raw.portalGift===true,lamp:bounded(raw.lamp,0,100,50),lightRoute:raw.lightRoute==='blue'?'blue':'amber',draft:cleanArt(raw.draft),art:cleanArt(raw.art),exhibited:raw.exhibited===true,paused:raw.paused===true};
}
export function rewoundState(previous) { return {...initialState(),draft:cleanArt(previous.draft),art:cleanArt(previous.art),exhibited:previous.exhibited,paused:previous.paused}; }
export function readState(storage) { try {return {state:validateState(JSON.parse(storage.getItem(STORAGE_KEY))),saved:true};}catch{return {state:initialState(),saved:false};} }
export function writeState(storage,state) {try{storage.setItem(STORAGE_KEY,JSON.stringify(validateState(state)));return true;}catch{return false;}}
