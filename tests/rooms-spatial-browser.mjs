import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {initialState,STORAGE_KEY,ROOM_IDS} from '../rooms/state.js';

// Actual rendered pixels are the observable result. Hidden fallback SVG changes
// alone must never satisfy these checks.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.env.ROOMS_EVIDENCE||'.rooms-spatial-evidence');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.json':'application/json'};
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root.endsWith(sep)?root:root+sep))throw Error('Invalid path');const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=process.env.ROOMS_URL||`http://127.0.0.1:${server.address().port}/rooms/`;
const browser=await chromium.launch({channel:process.env.ROOMS_BROWSER||'msedge',headless:true});
const checks=[],errors=[],failed=[],inherited=[],scenes=[],changes=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)throw Error(name);};
const contexts=[];
async function newPage(options={}){
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,...options});contexts.push(context);
 await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));},{key:STORAGE_KEY,state:{...initialState(),paused:true}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push({url:page.url(),error:e.message}));
 page.on('console',m=>{if(m.type()==='error'){const item={text:m.text(),url:m.location().url};(item.url.includes('/api/events')?inherited:errors).push(item);}});
 page.on('requestfailed',r=>{const item={url:r.url(),error:r.failure()?.errorText};(item.url.includes('/api/events')?inherited:failed).push(item);});
 return page;
}
const page=await newPage();
const canvas=p=>p.locator('.spatial-scene canvas.webgl-scene');
const visit=async(p,id)=>{await p.goto(base+'#/'+id,{waitUntil:'domcontentloaded'});await p.waitForFunction(id=>document.body.dataset.room===id,id);await p.locator('.spatial-scene.webgl-ready').waitFor({timeout:10000});await canvas(p).waitFor({state:'visible'});await p.waitForTimeout(100);};
const pixels=async p=>createHash('sha256').update(await canvas(p).evaluate(el=>el.toDataURL())).digest('hex');
const stats=async p=>JSON.parse(await canvas(p).getAttribute('data-scene-stats'));
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE_KEY);
const range=async(p,selector,value)=>{await p.locator(selector).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);};
async function changed(p,name,action){
 const before=await pixels(p),beforeStats=await stats(p);await action();
 let after=before;const deadline=Date.now()+5000;
 while(after===before&&Date.now()<deadline){await p.waitForTimeout(100);after=await pixels(p);}
 const afterStats=await stats(p);changes.push({name,before,after,beforeStats,afterStats});
 check(name,after!==before,{before,after,updates:afterStats.updates});return after;
}
async function inspect(p,label){
 const evidence=await canvas(p).evaluate(el=>{
  const gl=el.getContext('webgl'),colors=new Set(),pixel=new Uint8Array(4);
  for(let y=1;y<8;y++)for(let x=1;x<11;x++){gl.readPixels(Math.floor(el.width*x/11),Math.floor(el.height*y/8),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);colors.add([...pixel.slice(0,3)].join(','));}
  return {width:el.width,height:el.height,colors:colors.size,stats:JSON.parse(el.dataset.sceneStats||'{}')};
 });
 check(label+' renders nonempty real 3D geometry',evidence.width>0&&evidence.height>0&&evidence.colors>4&&evidence.stats.objects>0&&evidence.stats.triangles>0&&evidence.stats.draws>0,evidence);
 const hotspots=p.locator('.scene-hotspot:visible'),count=await hotspots.count();
 const accessible=await hotspots.evaluateAll(items=>items.map(el=>({label:el.getAttribute('aria-label'),href:el.getAttribute('href'),tabIndex:el.tabIndex,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 check(label+' has named keyboard/touch scene controls',count>0&&accessible.every(item=>item.label&&item.href&&item.tabIndex>=0&&item.width>=44&&item.height>=44),accessible);
 await hotspots.first().focus();check(label+' scene controls accept keyboard focus',await hotspots.first().evaluate(el=>document.activeElement===el));
 check(label+' has no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const idleDraws=(await stats(p)).draws;await p.waitForTimeout(150);check(label+' stays idle while motion is paused',(await stats(p)).draws===idleDraws);
 scenes.push({label,...evidence,hotspots:accessible});
}
async function run(name,action,p=page){
 try{await action();}catch(error){checks.push({name:name+' RUN ERROR',pass:false,detail:error.stack});await p.screenshot({path:resolve(out,name+'-failure.png'),fullPage:true}).catch(()=>{});}
}
let museumArtworkPixels,artwork;
try{
 for(const id of ROOM_IDS)await run('desktop-'+id,async()=>{await visit(page,id);await inspect(page,'desktop '+id);});
 await run('camera-controls',async()=>{
  for(const id of ROOM_IDS.filter(id=>id!=='workbench')){
   await visit(page,id);const left=page.locator('button[data-view="left"]');
   if(await left.count()){await changed(page,id+' left camera changes rendered perspective',()=>left.click());await changed(page,id+' center camera returns perspective',()=>page.locator('button[data-view="center"]').click());}
   const detail=page.locator('button[data-view="detail"]');if(await detail.count()){await changed(page,id+' Inspect reveals a closer rendered view',()=>detail.click());await changed(page,id+' Room view returns from Inspect',()=>page.locator('button[data-view="center"]').click());}
  }
 });
 await run('museum-objects',async()=>{
  await visit(page,'museum');await changed(page,'Museum object choice changes the visible 3D object and shadow',()=>page.locator('[data-object="key"]').click());
  await changed(page,'Museum lamp angle changes rendered light/shadow',()=>range(page,'#museum-angle',30));
  const before=await page.locator('[data-object][aria-pressed=true]').getAttribute('data-object');
  await changed(page,'Museum object hotspot works with keyboard',()=>page.locator('.scene-hotspot').filter({hasText:'Change the object'}).press('Enter'));
  check('Museum hotspot advances actual object control',await page.locator('[data-object][aria-pressed=true]').getAttribute('data-object')!==before);
 });
 await run('library',async()=>{
  await visit(page,'library');await changed(page,'Library book choice changes its rendered miniature world',()=>page.locator('[data-book="2"]').click());
  await changed(page,'Library folding control physically closes the 3D world',()=>range(page,'#library-open',0));
  await changed(page,'Library opening control restores its 3D world',()=>range(page,'#library-open',100));
 });
 await run('observatory',async()=>{
  await visit(page,'observatory');await changed(page,'Observatory bearing changes the visible constellation',()=>range(page,'#observatory-turn',160));
  await changed(page,'Observatory marble returns to a different visible resting point',()=>page.locator('#observatory-drop').click());
  check('paused marble action completes with usable control',(await page.locator('#observatory-note').textContent()).includes('came back')&&!await page.locator('#observatory-drop').isDisabled());
 });
 await run('specimens',async()=>{
  await visit(page,'specimens');await changed(page,'Specimen light causes a rendered response',()=>range(page,'#sp-light-control',90));
  await changed(page,'Specimen warmth causes a separate rendered response',()=>range(page,'#sp-warmth-control',85));
  await changed(page,'Specimen tapping changes its rendered membrane',()=>page.locator('#sp-tap').click());
 });
 await run('soft',async()=>{
  await visit(page,'soft');await changed(page,'Soft press deforms the 3D materials',()=>range(page,'#sf-compress',85));
  await changed(page,'paused Soft release visibly settles the materials',()=>page.locator('#sf-release').click());
  await page.waitForTimeout(180);const settled=await pixels(page),settledStats=await stats(page);await page.waitForTimeout(250);
  check('paused Soft material does not keep animating or redrawing',await pixels(page)===settled&&(await stats(page)).draws===settledStats.draws);
  await page.locator('#pause').click();await range(page,'#sf-compress',85);await page.waitForTimeout(100);await page.locator('#sf-release').click();await page.waitForTimeout(160);const rebound=await pixels(page);await page.waitForTimeout(2700);
  check('unpaused Soft rebound evolves and settles',await pixels(page)!==rebound);await page.locator('#pause').click();
 });
 await run('mirrors',async()=>{
  await visit(page,'mirrors');await changed(page,'Mirror position changes visible disagreeing reflections',()=>range(page,'#mi-position',80));
  await changed(page,'Mirror rotation changes the rendered reflection arrangement',()=>range(page,'#mi-angle',60));
  await changed(page,'Mirror center resets the actual rendered arrangement',()=>page.locator('#mi-center').click());
 });
 await run('traffic',async()=>{
  await visit(page,'traffic');await changed(page,'Traffic switch changes rendered exhibit routing',()=>page.locator('[data-signal="2"]').click());
  await changed(page,'Traffic screen shows its distinct active 3D state',()=>page.locator('#tr-play').click());
  await page.frameLocator('#tr-live-screen iframe').locator('canvas').first().waitFor({timeout:12000});check('unchanged Traffic game loads within the attraction',true);
  await page.locator('#tr-close').click();check('closing Traffic removes its game iframe and restores trigger focus',await page.locator('#tr-live-screen iframe').count()===0&&await page.locator('#tr-play').evaluate(el=>document.activeElement===el));
 });
 await run('workbench-artwork',async()=>{
  await visit(page,'museum');const empty=await pixels(page);
  await visit(page,'workbench');const bench=await pixels(page);await page.locator('#use-instrument').press('Enter');await page.waitForFunction(()=>document.querySelector('#instrument-view')?.dataset.loadState==='ready',null,{timeout:12000});
  check('Workbench approach renders a different instrument camera',await pixels(page)!==bench);
  const instrument=page.frameLocator('#instrument-view iframe');check('repaired Scribble reaches initialized actual canvas',await instrument.locator('html').getAttribute('data-scribble-ready')==='true'&&await instrument.locator('#view').getAttribute('width')==='600');
  await page.locator('#step-back').click();check('Workbench Step back still pauses the retained instrument',(await instrument.locator('#mobilePause').textContent()).includes('Resume'));
  await page.locator('#open-draft').click();await page.getByRole('button',{name:'Sprout stamp',exact:true}).click();
  const paper=page.locator('#work-paper');await paper.scrollIntoViewIfNeeded();const b=await paper.boundingBox();await page.mouse.move(b.x+b.width*.2,b.y+b.height*.3);await page.mouse.down();await page.mouse.move(b.x+b.width*.6,b.y+b.height*.6,{steps:12});await page.mouse.up();await page.locator('#send-exhibit').click();
  artwork=(await state(page)).art;check('draft is copied into independent persisted museum artwork',artwork.stamp==='sprout'&&artwork.strokes.length>0);
  await visit(page,'museum');museumArtworkPixels=await pixels(page);check('workbench artwork visibly appears in the 3D Museum',museumArtworkPixels!==empty);
 });
 await run('lighting-consequence',async()=>{
  await visit(page,'museum');const before=await pixels(page);await visit(page,'counterweight');
  await changed(page,'Counterweight physically moves its weight and linkage',()=>range(page,'#weight-control',90));
  await changed(page,'Counterweight routing changes the visible mechanism',()=>page.locator('#route-blue').click());
  await visit(page,'museum');check('routed light visibly changes the 3D Museum',await pixels(page)!==before);check('museum lighting consequences persist',(await state(page)).lamp===90&&(await state(page)).lightRoute==='blue');
 });
 await run('weather-consequence',async()=>{
  await visit(page,'hall');const dry=await pixels(page);await visit(page,'conservatory');
  await changed(page,'Conservatory cloud count changes visible cloud geometry',()=>range(page,'#garden-cloud-control',3));
  await changed(page,'Conservatory rain changes the rendered weather',()=>range(page,'#garden-rain-control',80));
  await changed(page,'Conservatory planting changes rendered plants',()=>page.locator('#garden-grow').click());
  await changed(page,'Conservatory drain changes the room visibly',()=>page.locator('#garden-drain').click());
  await visit(page,'hall');check('drained rain visibly adds Hall water and boat',await pixels(page)!==dry&&(await state(page)).hallWater===80);
 });
 await run('portal-consequence',async()=>{
  await visit(page,'hall');const noParcel=await pixels(page);await visit(page,'portal');
  await changed(page,'Portal turning changes the actual view beyond its doorway',()=>page.locator('#portal-turn').click());
  await changed(page,'Portal third view is visually distinct',()=>page.locator('#portal-turn').click());
  check('third portal destination exposes the existing Dungeon game',await page.locator('#portal-discovery a').isVisible()&&(await page.locator('#portal-discovery a').getAttribute('href')).includes('/games/dungeon-reset/'));
  await changed(page,'Portal sends its visible parcel away',()=>page.locator('#portal-send').click());
  await visit(page,'hall');const delivered=await pixels(page);check('portal parcel visibly arrives in the Hall',delivered!==noParcel&&(await state(page)).portalGift);
  await page.reload();await canvas(page).waitFor();await page.waitForTimeout(150);check('Hall consequences render identically after reload',await pixels(page)===delivered);
 });
 await run('rewind',async()=>{
  await visit(page,'hall');const altered=await pixels(page);await page.locator('#reset-open').click();await page.locator('#reset-confirm').click();await page.waitForTimeout(200);
  const reset=await state(page);check('rewind visibly restores the Hall and clears effects',await pixels(page)!==altered&&reset.hallWater===0&&!reset.portalGift&&reset.lamp===50&&reset.lightRoute==='amber');
  check('rewind preserves actual user artwork',artwork&&JSON.stringify(reset.art)===JSON.stringify(artwork)&&reset.exhibited);
  await visit(page,'museum');check('retained artwork still renders after rewind',museumArtworkPixels&&await pixels(page)===museumArtworkPixels);
 });
 await run('navigation-and-games',async()=>{
  await visit(page,'library');await page.locator('#next').click();await page.waitForFunction(()=>document.body.dataset.room==='observatory');await page.goBack();await page.waitForFunction(()=>document.body.dataset.room==='library');await page.goForward();await page.waitForFunction(()=>document.body.dataset.room==='observatory');await page.reload();await canvas(page).waitFor();check('3D rooms retain back/forward and deep-link reload',await page.locator('body').getAttribute('data-room')==='observatory');
  await page.locator('#directory-open').click();const links=page.locator('#game-directory a');check('all eight direct game routes remain available',await links.count()===8);
  for(const href of await links.evaluateAll(items=>items.map(el=>el.href))){const response=await page.request.get(href),body=await response.text();check('actual game loads '+new URL(href).pathname,response.ok()&&(body.includes('<canvas')||body.includes('phaser.min.js'))&&!body.includes('id="room-stage"'));}
  await page.keyboard.press('Escape');
 });
 const mobile=await newPage({viewport:{width:390,height:844},hasTouch:true});
 for(const id of ROOM_IDS)await run('mobile-'+id,async()=>{await visit(mobile,id);await inspect(mobile,'mobile '+id);},mobile);
 await run('mobile-hotspot-navigation',async()=>{
  await visit(mobile,'museum');const cable=mobile.locator('.scene-hotspot[href="#/counterweight"]');await cable.tap();
  check('mobile room link first tap identifies without navigating',await mobile.locator('body').getAttribute('data-room')==='museum'&&await cable.evaluate(el=>el.classList.contains('is-identified')));
  await cable.tap();await mobile.waitForFunction(()=>document.body.dataset.room==='counterweight');check('mobile room link second tap enters',true);
  await visit(mobile,'museum');await mobile.locator('.scene-hotspot[href="#/counterweight"]').press('Enter');await mobile.waitForFunction(()=>document.body.dataset.room==='counterweight');check('keyboard room link enters directly',true);
 },mobile);
 await run('narrow-layout',async()=>{await mobile.setViewportSize({width:320,height:844});for(const id of ROOM_IDS){await visit(mobile,id);check('320px '+id+' has no horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}},mobile);
 const reduced=await newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await run('reduced-motion',async()=>{
  await visit(reduced,'soft');check('reduced motion is exposed in the actual control',await reduced.locator('#pause').isDisabled());
  await changed(reduced,'reduced-motion Soft press changes rendered materials',()=>range(reduced,'#sf-compress',85));await changed(reduced,'reduced-motion release settles immediately',()=>reduced.locator('#sf-release').click());
  await reduced.waitForTimeout(150);const still=await pixels(reduced),count=(await stats(reduced)).draws;await reduced.waitForTimeout(300);check('reduced-motion Soft remains still without redraw loop',await pixels(reduced)===still&&(await stats(reduced)).draws===count);
  await visit(reduced,'observatory');await changed(reduced,'reduced-motion marble retains its visible payoff',()=>reduced.locator('#observatory-drop').click());
 },reduced);
 const fallback=await newPage({viewport:{width:390,height:844}});
 await run('context-loss-fallback',async()=>{
  await visit(fallback,'museum');const supported=await canvas(fallback).evaluate(el=>{const extension=el.getContext('webgl').getExtension('WEBGL_lose_context');extension?.loseContext();return !!extension;});
  check('isolated browser supports the context-loss discriminator',supported);await fallback.locator('.spatial-scene.webgl-fallback').waitFor();
  const visibility=await fallback.evaluate(()=>{const scene=document.querySelector('.spatial-scene'),canvas=scene.querySelector('canvas'),art=scene.querySelector('.room-art'),cs=canvas&&getComputedStyle(canvas);return {artVisible:!!art&&getComputedStyle(art).visibility==='visible',canvasHidden:!canvas||cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0};});
  await fallback.screenshot({path:resolve(out,'context-loss-fallback.png'),fullPage:true});
  check('lost WebGL context visibly exposes the illustrated fallback',visibility.artVisible&&visibility.canvasHidden,visibility);
  const before=createHash('sha256').update(await fallback.locator('.scene-world').screenshot()).digest('hex');await fallback.locator('[data-object="key"]').click();
  const after=createHash('sha256').update(await fallback.locator('.scene-world').screenshot()).digest('hex');
  check('fallback control changes actual visible illustration pixels',before!==after&&await fallback.locator('[data-object="key"]').getAttribute('aria-pressed')==='true');
 },fallback);
 const blocked=await newPage({viewport:{width:390,height:844}});
 await blocked.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^(webgl|webgl2|experimental-webgl)$/.test(type)?null:original.call(this,type,...args);};});
 await run('blocked-webgl-startup',async()=>{
  await blocked.goto(base+'#/museum',{waitUntil:'domcontentloaded'});await blocked.locator('.spatial-scene.webgl-fallback').waitFor();
  check('blocked WebGL startup exposes the illustrated room',await blocked.locator('.room-art').isVisible()&&await blocked.locator('.webgl-scene').count()===0&&!await blocked.locator('.room-camera-controls').isVisible());
  const before=createHash('sha256').update(await blocked.locator('.scene-world').screenshot()).digest('hex');await blocked.locator('[data-object="spoon"]').click();
  const after=createHash('sha256').update(await blocked.locator('.scene-world').screenshot()).digest('hex');check('startup fallback controls change actual visible pixels',before!==after);
  await blocked.screenshot({path:resolve(out,'blocked-webgl-startup.png'),fullPage:true});
  await blocked.locator('#next').click();await blocked.waitForFunction(()=>document.body.dataset.room==='library');check('startup fallback preserves room navigation',await blocked.locator('.room-art').isVisible());
 },blocked);
 check('no unexpected browser errors',errors.length===0,errors);check('no unexpected asset request failures',failed.length===0,failed);
}finally{
 await writeFile(resolve(out,'spatial-browser-report.json'),JSON.stringify({base,checks,scenes,changes,errors,failed,inherited},null,2));
 await Promise.allSettled(contexts.map(context=>context.close()));await browser.close();server.close();
}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(check=>check.pass).length,failures:checks.filter(check=>!check.pass),errors,failed,inherited},null,2));
if(checks.some(check=>!check.pass))process.exitCode=1;
