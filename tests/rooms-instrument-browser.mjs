import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.env.ROOMS_EVIDENCE||'.rooms-instrument-evidence');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root))throw Error('Invalid path');const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=process.env.ROOMS_URL||`http://127.0.0.1:${server.address().port}/rooms/`;
const browser=await chromium.launch({channel:process.env.ROOMS_BROWSER||'msedge',headless:true});
const checks=[],diagnostics=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail?{detail}:{})});if(!pass)throw Error(name);};
const isInstrument=url=>url.pathname==='/games/scribble-engine/'&&url.searchParams.get('instrument')==='1';
const visit=async(page,room)=>{await page.goto(base+'#/'+room);await page.waitForFunction(id=>document.body.dataset.room===id,room);};
const ready=page=>page.waitForFunction(()=>document.querySelector('#instrument-view')?.dataset.loadState==='ready',null,{timeout:12000});
const frame=page=>page.frameLocator('#instrument-view iframe');
const paused=async page=>/Resume/.test(await frame(page).locator('#mobilePause').textContent());
const imageHash=async page=>createHash('sha256').update(await frame(page).locator('#view').evaluate(canvas=>canvas.toDataURL())).digest('hex');
const screenshot=(page,name)=>page.screenshot({path:resolve(out,name+'.png'),fullPage:true});

async function holdFirstNavigation(page){
 let releaseGate,requested,requestTimer,count=0;
 const gate=new Promise(resolve=>releaseGate=resolve),requestSeen=new Promise((resolve,reject)=>{requested=()=>{clearTimeout(requestTimer);resolve();};requestTimer=setTimeout(()=>reject(Error('Instrument navigation was not requested within 15 seconds')),15000);});
 await page.route(isInstrument,async route=>{count++;if(count===1){requested();await gate;}await route.continue().catch(()=>{});});
 return {release(){clearTimeout(requestTimer);releaseGate();},requestSeen,get count(){return count;}};
}
async function scenario(name,options,run){
 const context=await browser.newContext({viewport:{width:1260,height:1000},...options}),page=await context.newPage(),errors=[],failed=[],inherited=[],simulated=[],expectedFailures=new WeakMap();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'){const item={message:message.text(),url:message.location().url};if(item.url.includes('/api/events'))inherited.push(item);else errors.push(item);}});
 page.on('requestfailed',request=>{const item={url:request.url(),error:request.failure()?.errorText};if(expectedFailures.get(request)===item.error)simulated.push(item);else if(item.url.includes('/api/events'))inherited.push(item);else failed.push(item);});
 try{await run(page,(request,error)=>expectedFailures.set(request,error));check(name+' has no unexpected runtime or request errors',errors.length===0&&failed.length===0,{errors,failed});}
 catch(error){checks.push({name:name+' RUN ERROR',pass:false,detail:error.stack});await screenshot(page,name+'-failure').catch(()=>{});}
 finally{diagnostics.push({name,errors,failed,inherited,simulated});await context.close();}
}

try{
 await scenario('normal',{},async page=>{
  let navigations=0;page.on('request',request=>{if(request.isNavigationRequest()&&isInstrument(new URL(request.url())))navigations++;});
  await visit(page,'workbench');check('ordinary entry begins with room motion enabled',await page.locator('#pause').getAttribute('aria-pressed')==='false');
  await page.locator('#use-instrument').click();await ready(page);await page.locator('#instrument-view').waitFor({state:'visible'});
  check('ready embedded controls are exposed',await page.locator('#instrument-view iframe').getAttribute('aria-hidden')==='false'&&!await page.locator('.instrument-load-panel').isVisible());
  await frame(page).locator('#length1').evaluate(el=>{el.value='123';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(250);
  await page.locator('#step-back').click();check('Step back closes and pauses a running instrument',!await page.locator('#instrument-view').isVisible()&&await paused(page));
  const retained=await imageHash(page);await page.locator('#use-instrument').click();await page.locator('#instrument-view').waitFor({state:'visible'});
  check('reopen preserves settings and exact paused drawing',await frame(page).locator('#length1').inputValue()==='123'&&await paused(page)&&await imageHash(page)===retained);
  check('successful session never offers reload retry',!await page.locator('#instrument-retry').isVisible()&&navigations===1,{navigations});await screenshot(page,'retained-session');
  await visit(page,'library');check('route cleanup closes viewer and clears approach styling',!await page.locator('#instrument-view').isVisible()&&await page.locator('body').evaluate(body=>!body.classList.contains('instrument-open'))&&await paused(page));
  await visit(page,'workbench');await page.locator('#use-instrument').click();await page.locator('#instrument-view').waitFor({state:'visible'});
  check('returning through another room retains the same instrument session',navigations===1&&await frame(page).locator('#length1').inputValue()==='123'&&await imageHash(page)===retained,{navigations});
  await page.keyboard.press('Escape');check('Escape pauses and returns without unloading',!await page.locator('#instrument-view').isVisible()&&await paused(page)&&await page.locator('#instrument-view iframe').count()===1);
 });

 await scenario('late-load',{},async page=>{
  const held=await holdFirstNavigation(page);
  try{
   await visit(page,'workbench');await page.locator('#use-instrument').click();await held.requestSeen;await page.locator('#instrument-view').waitFor({state:'visible'});
   check('pending navigation shows a loading panel',await page.locator('#instrument-view').getAttribute('data-load-state')==='loading'&&await page.locator('.instrument-load-panel').isVisible());
   await page.locator('#step-back').click();held.release();await ready(page);
   check('late arrival remains closed and pauses after initialization',!await page.locator('#instrument-view').isVisible()&&await paused(page));
   const retained=await imageHash(page);await page.locator('#use-instrument').click();await page.locator('#instrument-view').waitFor({state:'visible'});
   check('reopening a late-loaded session does not restart or reload it',await paused(page)&&held.count===1&&await imageHash(page)===retained,{navigations:held.count});await screenshot(page,'late-load-reopened');
  }finally{held.release();}
 });

 await scenario('empty-fallback',{viewport:{width:390,height:844}},async(page,expectFailure)=>{
  let navigations=0;
  // A 204 navigation commits no document, preserving a genuinely empty about:blank.
  await page.route(isInstrument,async route=>{navigations++;if(navigations===1){expectFailure(route.request(),'net::ERR_ABORTED');await route.fulfill({status:204,body:''});}else await route.continue();});
  await visit(page,'workbench');await page.locator('#use-instrument').click();
  await page.waitForFunction(()=>document.querySelector('#instrument-view')?.dataset.loadState==='unavailable',null,{timeout:11000});
  const empty=await page.locator('#instrument-view iframe').evaluate(el=>({url:el.contentDocument?.URL,children:el.contentDocument?.body?.childElementCount}));
  check('uncommitted navigation gets an honest fallback with safe retry',empty.url==='about:blank'&&empty.children===0&&await page.locator('#instrument-retry').isVisible()&&await page.locator('.instrument-load-panel').isVisible(),empty);
  const link=page.locator('.instrument-load-panel').getByRole('link',{name:'Open Scribble separately'});
  check('fallback provides direct separate-session access',await link.getAttribute('href')==='/games/scribble-engine/'&&await link.getAttribute('target')==='_blank'&&(await page.locator('.instrument-session-note').textContent()).includes('own session'));
  for(const width of[390,320]){
   await page.setViewportSize({width,height:844});
   const layout=await page.evaluate(()=>{const dialog=document.querySelector('#instrument-view'),panel=document.querySelector('.instrument-load-panel');return {viewport:innerWidth,page:document.documentElement.scrollWidth,dialog:dialog.scrollWidth,dialogWidth:dialog.clientWidth,panel:panel.scrollWidth,panelWidth:panel.clientWidth};});
   check(width+'px fallback has no horizontal overflow',layout.page<=layout.viewport&&layout.dialog<=layout.dialogWidth+1&&layout.panel<=layout.panelWidth+1,layout);
   await screenshot(page,'fallback-'+width);
  }
  await page.locator('#instrument-retry').click();await ready(page);
  check('safe retry reaches the actual initialized drawing instrument',navigations===2&&await frame(page).locator('html').getAttribute('data-scribble-ready')==='true'&&await frame(page).locator('#view').getAttribute('width')==='600',{navigations});
  check('retry is removed after successful recovery',!await page.locator('#instrument-retry').isVisible()&&!await page.locator('.instrument-load-panel').isVisible());
  await page.locator('#step-back').click();await page.locator('#use-instrument').click();await page.locator('#instrument-view').waitFor({state:'visible'});
  check('recovered session reopens paused without another request',navigations===2&&await paused(page),{navigations});await screenshot(page,'fallback-recovered');
 });

 await scenario('route-during-approach',{},async page=>{
  const held=await holdFirstNavigation(page);
  try{
   await visit(page,'workbench');await page.locator('#use-instrument').click();await held.requestSeen;await visit(page,'library');await page.waitForTimeout(650);
   check('leaving during approach cancels the pending dialog and body styling',!await page.locator('#instrument-view').isVisible()&&await page.locator('body').evaluate(body=>!body.classList.contains('instrument-open')));
   held.release();await ready(page);check('late load after route cleanup is paused without reopening',!await page.locator('#instrument-view').isVisible()&&await paused(page)&&await page.locator('body').getAttribute('data-room')==='library');
  }finally{held.release();}
 });

 await scenario('reduced-motion',{viewport:{width:390,height:844},reducedMotion:'reduce'},async page=>{
  await visit(page,'workbench');check('reduced motion is reflected in the room control',await page.locator('#pause').isDisabled());
  await page.locator('#use-instrument').press('Enter');await ready(page);check('reduced-motion keyboard entry reaches a visible usable instrument',await page.locator('#instrument-view').isVisible()&&await frame(page).locator('#mobilePause').isVisible());
  await page.locator('#step-back').click();check('reduced-motion Step back preserves and pauses the session',!await page.locator('#instrument-view').isVisible()&&await paused(page));
 });
}finally{
 await writeFile(resolve(out,'instrument-browser-report.json'),JSON.stringify({base,checks,diagnostics},null,2));await browser.close();server.close();
}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(check=>check.pass).length,failures:checks.filter(check=>!check.pass),diagnostics},null,2));
if(checks.some(check=>!check.pass))process.exitCode=1;
