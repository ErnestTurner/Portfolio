import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.env.ROOMS_EVIDENCE||'.rooms-evidence');await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.json':'application/json'};
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root))throw Error('invalid path');const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.ROOMS_BROWSER||'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1120}}),page=await context.newPage();
const errors=[],failed=[],checks=[],inheritedDiagnostics=[],spatialDiagnostics=[];
const isGameTelemetry=url=>{try{return new URL(url).pathname==='/api/events';}catch{return false;}};
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'){const item={message:m.text(),url:m.location().url};if(isGameTelemetry(item.url))inheritedDiagnostics.push(item);else errors.push(item);}});
page.on('requestfailed',r=>{const item={url:r.url(),error:r.failure()?.errorText,method:r.method()};if(isGameTelemetry(item.url)&&item.error==='net::ERR_ABORTED')inheritedDiagnostics.push(item);else failed.push(item);});
const base=process.env.ROOMS_URL||('http://127.0.0.1:'+server.address().port+'/rooms/');
const ids=['hall','workbench','museum','library','observatory','specimens','soft','mirrors','traffic','conservatory','counterweight','portal'];
const check=(name,ok,detail)=>{checks.push({name,pass:!!ok,...(detail?{detail}: {})});if(!ok)throw Error(name+(detail?' '+JSON.stringify(detail):''));};
const visit=async id=>{await page.goto(base+'#/'+id);await page.locator('#room-title').waitFor();await page.waitForFunction(id=>document.body.dataset.room===id,id);};
const range=async(selector,value)=>{await page.locator(selector).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);};
const openDraft=async target=>{await target.locator('#open-draft').click();await target.locator('#draft-sheet').waitFor({state:'visible'});};
const inspectSpatial=async(label,target=page)=>{
 const scene=target.locator('.spatial-scene');
 await scene.waitFor({state:'visible'});
 const ready=await scene.evaluate(el=>el.classList.contains('webgl-ready'));
 if(!ready){
  check(label+' has usable illustrated fallback',await scene.evaluate(el=>el.classList.contains('webgl-fallback'))&&await scene.locator('.spatial-art').isVisible());
  spatialDiagnostics.push({label,mode:'illustrated fallback'});return false;
 }
 const canvas=scene.locator('.webgl-scene');await canvas.waitFor({state:'visible'});
 await canvas.evaluate(el=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const evidence=await canvas.evaluate(el=>{
  const stats=JSON.parse(el.dataset.sceneStats||'{}'),gl=el.getContext('webgl'),colors=new Set(),pixel=new Uint8Array(4);
  for(let row=1;row<6;row++)for(let col=1;col<8;col++){gl.readPixels(Math.floor(el.width*col/8),Math.floor(el.height*row/6),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);colors.add([...pixel.slice(0,3)].join(','));}
  return {stats,width:el.width,height:el.height,sampledColors:colors.size};
 });
 check(label+' draws visible 3D meshes',evidence.width>0&&evidence.height>0&&evidence.stats.objects>0&&evidence.stats.triangles>0&&evidence.stats.draws>0&&evidence.sampledColors>3,evidence);
 check(label+' has reachable scene anchors',await scene.locator('.scene-hotspot:visible').count()>0);
 spatialDiagnostics.push({label,mode:'WebGL',...evidence});return true;
};
try{
for(const id of ids){await visit(id);if(id==='hall'||id==='workbench')await inspectSpatial('desktop '+id);await page.screenshot({path:resolve(out,'desktop-'+id+'.png'),fullPage:true});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);check('desktop '+id+' no overflow',!overflow);check('room '+id+' has scene',await page.locator(id==='hall'||id==='workbench'?'.spatial-scene':'.room-art').count()===1);}
await visit('hall');
if(await inspectSpatial('hall navigation')){
 check('all eleven spatial doorway destinations',JSON.stringify((await page.locator('.scene-hotspot').evaluateAll(links=>links.map(link=>link.getAttribute('href')).sort())))===JSON.stringify(ids.slice(1).map(id=>'#/'+id).sort()));
 const doorway=page.locator('.scene-hotspot:visible').first(),destination=(await doorway.getAttribute('href')).slice(2);await doorway.click();await page.waitForFunction(id=>document.body.dataset.room===id,destination);check('projected doorway enters its room',true);await visit('hall');
}
await page.locator('.hall-door-list summary').click();check('room index opens all eleven destinations',await page.locator('.hall-mobile-doors a:visible').count()===11);await page.locator('.hall-mobile-doors a[href="#/museum"]').click();await page.waitForFunction(()=>document.body.dataset.room==='museum');check('room index enters selected room',true);
await visit('hall');await page.locator('#pause').click();await page.locator('button[data-view="right"]').click();check('paused camera selects authored right view',await page.locator('.hall-scene').getAttribute('data-view')==='right'&&await page.locator('button[data-view="right"]').getAttribute('aria-pressed')==='true');
if(await page.locator('.webgl-scene').count()){
 const stableFrame=()=>page.locator('.webgl-scene').evaluate(el=>({image:el.toDataURL(),draws:JSON.parse(el.dataset.sceneStats).draws}));
 await page.locator('.webgl-scene').evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const still=await stableFrame();await page.waitForTimeout(180);const later=await stableFrame();check('paused fixed camera holds the rendered view',still.image===later.image&&still.draws===later.draws);
}
await page.locator('#pause').click();
await visit('workbench');check('draft begins put away',!await page.locator('#draft-sheet').isVisible());await page.locator('#use-instrument').click();await page.locator('#instrument-view').waitFor({state:'visible'});
const instrument=page.frameLocator('#instrument-view iframe');await instrument.locator('#view').waitFor({state:'visible'});await instrument.locator('#length1').evaluate(el=>{el.value='123';el.dispatchEvent(new Event('input',{bubbles:true}));});
check('instrument uses embedded presentation',await instrument.locator('html').getAttribute('data-instrument')!==null&&!await instrument.locator('.arcade-back').isVisible());
await page.locator('#step-back').click();check('step back closes viewer and retains iframe',!await page.locator('#instrument-view').isVisible()&&await page.locator('#instrument-view iframe').count()===1);await page.locator('#use-instrument').click();check('instrument settings survive step back',await instrument.locator('#length1').inputValue()==='123');check('step back pauses the instrument',!(await instrument.locator('#mobilePause').textContent()).includes('Pause'));await page.keyboard.press('Escape');check('instrument Escape returns to workbench',!await page.locator('#instrument-view').isVisible()&&await page.locator('body').getAttribute('data-room')==='workbench');
await openDraft(page);await page.getByRole('button',{name:'Sprout stamp',exact:true}).click();
const paper=page.locator('#work-paper');await paper.scrollIntoViewIfNeeded();const box=await paper.boundingBox();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await page.mouse.down();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.4,{steps:10});await page.mouse.up();await page.getByRole('button',{name:'Send to museum'}).click();
await visit('museum');check('drawing arrives museum',await page.locator('.museum-mark polyline').count()===1);const artBefore=await page.locator('.museum-mark').innerHTML();
const shadowBefore=await page.locator('#museum-shadow').innerHTML();await page.getByRole('button',{name:'Key',exact:true}).click();check('ordinary object changes shadow',(await page.locator('#museum-shadow').innerHTML())!==shadowBefore);await range('#museum-angle',30);check('lamp moves shadow',(await page.locator('#museum-shadow').getAttribute('transform')).includes('45'));
await visit('counterweight');await range('#weight-control',90);await page.getByRole('button',{name:'Blue glass'}).click();await visit('museum');check('routed light reaches museum',await page.locator('#museum-feed').getAttribute('fill')==='#74b8db');
await visit('conservatory');await range('#garden-rain-control',80);await page.locator('#garden-drain').click();await visit('hall');check('rain creates hall puddle',await page.locator('.hall-puddle').getAttribute('opacity')==='0.8');
await visit('portal');await page.locator('#portal-send').click();await visit('hall');check('portal parcel reaches hall',(await page.locator('.spatial-art').innerHTML()).includes('translate(855 490)'));await page.reload();check('cross-room state survives reload',await page.locator('.hall-puddle').getAttribute('opacity')==='0.8');
await visit('library');const world=await page.locator('#library-world').innerHTML();await page.locator('[data-book="2"]').click();check('book contains different visual world',(await page.locator('#library-world').innerHTML())!==world);await range('#library-open',0);check('book physically folds',(await page.locator('#library-world').getAttribute('transform')).includes('scale(1 0)'));
await visit('observatory');await page.locator('#observatory-drop').click();await page.waitForFunction(()=>document.querySelector('#observatory-note').textContent.includes('came back'),null,{timeout:6000});check('marble returns from above',true);
await visit('specimens');const creature=await page.locator('#sp-photophile').getAttribute('transform');await range('#sp-light-control',90);check('light changes specimen',(await page.locator('#sp-photophile').getAttribute('transform'))!==creature);await range('#sp-warmth-control',80);await page.locator('#sp-tap').click();check('tap changes separate specimen',(await page.locator('#sp-pulse-counter').textContent()).includes('1 TAP'));
await visit('soft');await range('#sf-compress',85);const compressed=await page.locator('#sf-gel').getAttribute('transform');await page.locator('#sf-release').click();await page.waitForTimeout(2500);check('soft material rebounds',(await page.locator('#sf-gel').getAttribute('transform'))!==compressed);
await visit('mirrors');const beforeMirror=await page.locator('#mi-opposite').getAttribute('transform');await range('#mi-position',80);check('reflection disagrees',(await page.locator('#mi-opposite').getAttribute('transform'))!==beforeMirror);
await visit('traffic');const route=await page.locator('#tr-route').getAttribute('d');await page.locator('[data-signal="2"]').click();check('traffic switch routes physical signal',(await page.locator('#tr-route').getAttribute('d'))!==route);await page.locator('#tr-play').click();await page.locator('#tr-live-screen iframe').waitFor();const frame=page.frameLocator('#tr-live-screen iframe');await frame.locator('canvas').first().waitFor();check('unchanged traffic embedded game loads',true);await page.waitForTimeout(700);await page.locator('#tr-close').click();check('closing traffic unloads iframe',await page.locator('#tr-live-screen iframe').count()===0);
await visit('museum');await page.locator('#reset-open').click();await page.locator('#reset-confirm').click();check('rewind preserves museum drawing',(await page.locator('.museum-mark').innerHTML())===artBefore);await visit('hall');check('rewind drains puddle',await page.locator('.hall-puddle').getAttribute('opacity')==='0');check('rewind retrieves portal parcel',!(await page.locator('.spatial-art').innerHTML()).includes('translate(855 490)'));
await visit('library');await page.locator('#next').click();await page.waitForFunction(()=>document.body.dataset.room==='observatory');await page.goBack();await page.waitForFunction(()=>document.body.dataset.room==='library');await page.goForward();await page.waitForFunction(()=>document.body.dataset.room==='observatory');check('back forward navigation',true);await page.reload();check('deep link reload',await page.locator('#room-title').textContent()==='The Observatory');
await page.locator('#directory-open').click();check('all eight direct game links',await page.locator('#game-directory a').count()===8);await page.keyboard.press('Escape');check('directory escape closes',!await page.locator('#directory').isVisible());
await page.setViewportSize({width:390,height:844});for(const id of ids){await visit(id);if(id==='hall'||id==='workbench')await inspectSpatial('mobile '+id);await page.screenshot({path:resolve(out,'mobile-'+id+'.png'),fullPage:true});check('mobile '+id+' no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await visit('hall');await page.locator('.hall-door-list summary').click();check('mobile room index exposes all doors',await page.locator('.hall-mobile-doors a:visible').count()===11);check('mobile open room index has no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.hall-mobile-doors a[href="#/workbench"]').click();await page.waitForFunction(()=>document.body.dataset.room==='workbench');await openDraft(page);check('mobile drafting sheet opens',await page.locator('#work-paper').isVisible());await page.locator('#close-draft').click();check('putting down sheet restores entry focus',!await page.locator('#draft-sheet').isVisible()&&await page.evaluate(()=>document.activeElement.id==='open-draft'));
await page.setViewportSize({width:320,height:740});for(const id of ids){await visit(id);check('narrow phone '+id+' no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await visit('library');await page.locator('#library-open').focus();const beforeKey=Number(await page.locator('#library-open').inputValue());await page.keyboard.press('ArrowRight');check('keyboard range control',Number(await page.locator('#library-open').inputValue())===beforeKey+1);
await page.locator('.skip').focus();await page.keyboard.press('Enter');check('skip link stays in room',await page.evaluate(()=>document.activeElement.id==='room-title'&&document.body.dataset.room==='library'));
await page.locator('#pause').click();check('pause visible and persisted',await page.locator('#pause').getAttribute('aria-pressed')==='true');await page.reload();check('pause survives reload',await page.locator('#pause').getAttribute('aria-pressed')==='true');await page.locator('#pause').click();
await visit('portal');await page.locator('#portal-turn').click();await page.locator('#portal-turn').click();check('Dungeon discovery accessible',await page.locator('#portal-discovery').isVisible());
const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const touchPage=await touch.newPage();await touchPage.goto(base+'#/workbench');await openDraft(touchPage);await touchPage.getByRole('button',{name:'Spark stamp',exact:true}).tap();check('touch stamp alternative',await touchPage.getByRole('button',{name:'Spark stamp',exact:true}).getAttribute('aria-pressed')==='true');await touch.close();
await page.emulateMedia({reducedMotion:'reduce'});await visit('observatory');await page.locator('#observatory-drop').click();check('reduced motion immediate payoff',(await page.locator('#observatory-note').textContent()).includes('came back'));check('reduced motion reflected in control',await page.locator('#pause').isDisabled());
for(const slug of ['scribble-engine','jelly-bench','brain-in-a-jar','mirror-mischief','traffic-with-no-excuse','starfall','moon-snail','dungeon-reset']){const response=await context.request.get(new URL('/games/'+slug+'/index.html',base).href);const body=await response.text();check('full game route '+slug,response.ok()&&(body.includes('<canvas')||body.includes('phaser.min.js'))&&!body.includes('id="room-stage"'));}
const fallback=await browser.newContext();await fallback.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError')}});});const fallbackPage=await fallback.newPage();await fallbackPage.goto(base+'#/workbench');await openDraft(fallbackPage);await fallbackPage.getByRole('button',{name:'Spark stamp',exact:true}).click();check('blocked localStorage graceful fallback',(await fallbackPage.locator('#status').textContent()).includes('unavailable'));await fallback.close();
check('no room console/runtime errors',errors.length===0,errors);check('no room or game asset request failures',failed.length===0,failed);
}catch(error){checks.push({name:'RUN ERROR',pass:false,detail:error.stack});await page.screenshot({path:resolve(out,'failure.png'),fullPage:true});}
await writeFile(resolve(out,'browser-report.json'),JSON.stringify({base,checks,errors,failed,inheritedDiagnostics,spatialDiagnostics},null,2));
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.pass).length,failures:checks.filter(x=>!x.pass),errors,failed,inheritedDiagnostics},null,2));
await browser.close();server.close();if(checks.some(c=>!c.pass))process.exitCode=1;
