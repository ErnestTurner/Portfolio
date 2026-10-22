import {getInstrument} from './instrument-view.js';
import {mountScene} from './spatial-renderer.js';
import {makeHall,makeWorkbench} from './spatial-models.js';
// SVG illustrations are retained as the explicit WebGL fallback.
const doors=[['workbench','Workbench'],['museum','Museum'],['library','Library'],['observatory','Observatory'],['specimens','Specimens'],['soft','Soft materials'],['mirrors','Mirrors'],['traffic','Traffic control'],['conservatory','Conservatory'],['counterweight','Behind the walls'],['portal','Somewhere else']];
const svg=(content,label)=>`<svg class="spatial-art" viewBox="0 0 1200 720" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="${label}">${content}</svg>`;
const defs=`<defs>
 <linearGradient id="plaster" x2="0" y2="1"><stop stop-color="#e8e5da"/><stop offset="1" stop-color="#c9c8bc"/></linearGradient>
 <linearGradient id="left-wall"><stop stop-color="#888d86"/><stop offset=".6" stop-color="#c0c5b9"/><stop offset="1" stop-color="#d7d9cd"/></linearGradient>
 <linearGradient id="right-wall"><stop stop-color="#dcd9ca"/><stop offset="1" stop-color="#b7b5a7"/></linearGradient>
 <linearGradient id="stone" x2="0" y2="1"><stop stop-color="#858b81"/><stop offset="1" stop-color="#bbb9a8"/></linearGradient>
 <linearGradient id="recess"><stop stop-color="#132e33"/><stop offset="1" stop-color="#668a85"/></linearGradient>
 <linearGradient id="ceiling" x2="0" y2="1"><stop stop-color="#7c8982"/><stop offset="1" stop-color="#c6cec1"/></linearGradient>
 <linearGradient id="wood" x2="0" y2="1"><stop stop-color="#aa8561"/><stop offset=".5" stop-color="#795d47"/><stop offset="1" stop-color="#443c33"/></linearGradient>
 <radialGradient id="pool"><stop stop-color="#fff6cc" stop-opacity=".7"/><stop offset="1" stop-color="#fff6cc" stop-opacity="0"/></radialGradient>
 <linearGradient id="metal" x2="1" y2="1"><stop stop-color="#c4c8c1"/><stop offset=".5" stop-color="#747f78"/><stop offset=".53" stop-color="#d6d8cc"/><stop offset="1" stop-color="#8e9690"/></linearGradient>
 <filter id="soft-shadow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
 <pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 1h1M5 4h1" stroke="#fff" stroke-opacity=".075"/></pattern>
</defs>`;
function frameLink(id,title,index,body,visited){return `<a class="spatial-door hall-door" href="#/${id}" aria-label="Enter ${title}${visited?', visited':''}" data-name="${title}"><title>${title}</title>${body}</a>`;}
function sideDoor(id,title,index,t,side,visited,lean){
 const near=side==='left'?0:1200,sign=side==='left'?1:-1;
 const p=(depth,h)=>[near+sign*390*depth,60+120*depth+(660-360*depth)*h];
 const a=p(t,.19),b=p(t+.15,.19),c=p(t+.15,.92),d=p(t,.92);
 const pts=[a,b,c,d].map(q=>q.join(',')).join(' '),cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
 const inset=[a,b,c,d].map(([x,y])=>[x+(cx-x)*.12,y+((cy+100)-y)*.035]);
 const aperture=inset.map(q=>q.join(',')).join(' ');
 return frameLink(id,title,index,`<polygon points="${pts}" fill="#c4c9bf" stroke="#757e75" stroke-width="3"/><polygon class="door-aperture" points="${aperture}" fill="url(#recess)" stroke="#273c3a" stroke-width="6"/><path d="M${inset[0]}L${inset[3]}L${inset[3][0]+sign*12},${inset[3][1]-10}L${inset[0][0]+sign*12},${inset[0][1]+8}Z" fill="#a5b2a5"/><path d="M${inset[1]}L${inset[2]}" stroke="#162e30" stroke-width="9"/><path d="M${inset[3]}L${inset[2]}" stroke="#e8e3cc" stroke-width="4"/><path d="M${inset[0][0]+sign*16},${inset[0][1]+20}L${inset[3][0]+sign*16},${inset[3][1]-15}" stroke="#d2cf9d" stroke-opacity=".5" stroke-width="2"/><g class="door-leaf" style="transform-origin:${cx}px ${cy}px" transform="rotate(${visited?(index%2?1:-1)*lean*.2:0} ${cx} ${cy})"><path d="M${inset[1][0]},${inset[1][1]+4}L${inset[1][0]-sign*17},${inset[1][1]+13}L${inset[2][0]-sign*17},${inset[2][1]-6}L${inset[2]}Z" fill="#3f6d69" stroke="#254c4b"/></g><rect x="${cx-15}" y="${cy-29}" width="30" height="20" rx="1" fill="#eee9d8"/><text x="${cx}" y="${cy-14}" text-anchor="middle" class="door-plate">${String(index+2).padStart(2,'0')}</text>${visited?`<circle cx="${cx+20}" cy="${cy-20}" r="3" fill="#a75d37"/>`:''}`,visited);
}
function farDoor(id,title,index,x,visited){return frameLink(id,title,index,`<path d="M${x-7} 449V249q0-35 43-35t43 35v200" fill="#e7e5d7" stroke="#a8aca0" stroke-width="2"/><path class="door-aperture" d="M${x} 449V250q0-27 36-27t36 27v199Z" fill="url(#recess)" stroke="#324e4b" stroke-width="6"/><path d="M${x+8} 441V253q0-20 24-20" fill="none" stroke="#9aa99a" stroke-width="5"/><path d="M${x+65} 233l-17 18v187l17 7Z" fill="#3e6965"/><path d="M${x+15} 449l35-15 35 10-14 5Z" fill="#dfdcc2"/><rect x="${x+21}" y="190" width="30" height="20" fill="#f4efdb"/><text x="${x+36}" y="205" text-anchor="middle" class="door-plate">${String(index+2).padStart(2,'0')}</text>${index===10?`<ellipse cx="${x+35}" cy="330" rx="17" ry="70" fill="#9eb6ac" opacity=".3"/><circle cx="${x+29}" cy="305" r="7" fill="#efe7ab"/>`:''}${visited?`<circle cx="${x+75}" cy="200" r="3" fill="#a75d37"/>`:''}`,visited);}
function cameraControls(host){
 const scene=host.querySelector('.spatial-scene');
 host.querySelectorAll('button[data-view]').forEach(button=>button.onclick=()=>{scene.dataset.view=button.dataset.view;host.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
}
export function spatialHall(host,api){
 const count=api.state.visited.length,lean=Math.min(8,count-1),rain=api.state.hallWater;
 const left=doors.slice(0,4).map(([id,title],i)=>sideDoor(id,title,i,.06+i*.23,'left',api.state.visited.includes(id),lean)).join('');
 const right=doors.slice(4,8).map(([id,title],i)=>sideDoor(id,title,i+4,.06+i*.23,'right',api.state.visited.includes(id),lean)).join('');
 const back=doors.slice(8).map(([id,title],i)=>farDoor(id,title,i+8,435+i*115,api.state.visited.includes(id))).join('');
 host.innerHTML=`<div class="spatial-scene hall-scene" data-view="center"><div class="scene-world">${svg(`${defs}
 <rect width="1200" height="720" fill="#d9d9cb"/>
 <path d="M0 0H1200L810 180H390Z" fill="url(#ceiling)"/>
 <path d="M0 0L390 180V480L0 720Z" fill="url(#left-wall)"/>
 <path d="M1200 0L810 180V480L1200 720Z" fill="url(#right-wall)"/>
 <path d="M390 180H810V480H390Z" fill="url(#plaster)"/>
 <path d="M0 720L390 480H810L1200 720Z" fill="url(#stone)"/>
 <path d="M440 480L180 720M520 480L455 720M600 480L700 720M680 480L945 720M760 480L1190 720M315 526H885M200 597H1000M50 689H1150" stroke="#6c786f" stroke-opacity=".38"/>
 <path d="M0 713L390 474H810L1200 713" fill="none" stroke="#5b6d64" stroke-width="12"/>
 <path d="M0 60L390 190H810L1200 60M0 120L390 215M1200 120L810 215" stroke="#f1efdb" stroke-opacity=".6" stroke-width="3" fill="none"/>
 <path d="M310 0L465 164H735L890 0Z" fill="#f1efdc" stroke="#506e66" stroke-width="9"/>
 <path d="M390 0L510 164M600 0V164M810 0L690 164M365 55H835M415 110H785" stroke="#a7b8aa" stroke-width="5"/>
 <path d="M465 164L400 480L120 720H820L735 164Z" fill="#fff7cd" opacity=".1"/>
 <ellipse cx="600" cy="460" rx="330" ry="250" fill="url(#pool)"/>
 ${left}${right}${back}
 <path d="M0 28Q600 ${58+lean*6} 1200 28" fill="none" stroke="#3a544e" stroke-width="9"/><path d="M0 23Q600 ${53+lean*6} 1200 23" fill="none" stroke="#b3c3b1" stroke-width="2"/>
 <path d="M600 177v15" stroke="#566e60" stroke-width="3"/><circle cx="600" cy="170" r="15" fill="#e7e6d7" stroke="#6a7d6c" stroke-width="3"/><path d="M600 159v11l${lean+3} 5" fill="none" stroke="#a45b39" stroke-width="2"/>
 <g class="hall-puddle" opacity="${rain/100}"><ellipse cx="585" cy="615" rx="${90+rain}" ry="24" fill="#8daba6"/><ellipse cx="585" cy="614" rx="${80+rain}" ry="19" fill="none" stroke="#c7dbce"/><path d="M550 601l40 19 40-19Z" fill="#f3efdc"/><path d="M590 602v-31l-31 31Z" fill="#e7e2cd"/><path d="M590 602v-31l25 31Z" fill="#b9b78c"/></g>
 ${api.state.portalGift?'<g transform="translate(855 490) rotate(-12)"><ellipse cx="28" cy="50" rx="38" ry="8" fill="#394c45" opacity=".25"/><path d="M0 0l25-12 25 12-25 12Z" fill="#c3af84"/><path d="M0 0v28l25 13V12Z" fill="#a88c61"/><path d="M25 12l25-12v28L25 41Z" fill="#7e7051"/><path d="M0 10l25 12 25-13M25 12v29" stroke="#dad2b5" stroke-width="3"/></g>':''}
 <ellipse cx="183" cy="686" rx="135" ry="30" fill="#283e35" opacity=".25" filter="url(#soft-shadow)"/>
 <path d="M-35 583L166 544L304 617L86 669Z" fill="url(#wood)" stroke="#5d5040" stroke-width="3"/><path d="M-35 583v25L86 693L304 640v-23L86 669Z" fill="#5d4d3d"/><path d="M85 690v64M278 644v100" stroke="#4a4d40" stroke-width="19"/>
 <path d="M105 570l75-9 45 29-77 17Z" fill="#ede5cb"/><path d="M148 577l47 17M135 582l45 17M124 588l47 17" stroke="#8a8e7a" stroke-width="1.5"/>
 <path d="M1167 0h33v720h-62l10-530Z" fill="#59685f"/><path d="M1154 0h19l-19 720h-22Z" fill="#b3b7a5"/>
 <g transform="rotate(${lean*1.2} 1080 0)"><path d="M1080 0v390" stroke="#50645b" stroke-width="2"/><path d="M1080 388l-12 23 12 28 12-28Z" fill="url(#metal)"/><path d="M1080 392v38" stroke="#e9e5cc"/></g>
 <rect width="1200" height="720" fill="url(#grain)" pointer-events="none"/>`, 'A sunlit hall with deep doorways on three walls, a stone floor, skylight, foreground desk and hanging plumb weight. Each doorway opens a room.')}</div><div class="scene-caption"><span id="door-readout">Choose a doorway</span><span>${String(count).padStart(2,'0')} / 12 visited</span></div></div>
 <div class="spatial-controls"><div class="view-controls" aria-label="Camera position"><button data-view="left" aria-pressed="false">Left wall</button><button data-view="center" aria-pressed="true">Centre</button><button data-view="right" aria-pressed="false">Right wall</button></div><button id="hall-unusual">Visit an unopened room</button><details class="hall-door-list"><summary>Room index</summary><nav class="hall-mobile-doors" aria-label="Hall doors">${doors.map(([id,title],i)=>`<a href="#/${id}"><span>${String(i+2).padStart(2,'0')}</span>${title}</a>`).join('')}</nav></details><a href="./comparison/">Study notes &amp; comparison</a></div>`;
 mountScene(host.querySelector('.spatial-scene'),makeHall(api.state),api);
 const readout=host.querySelector('#door-readout');host.querySelectorAll('.spatial-door').forEach(a=>{a.addEventListener('pointerenter',()=>readout.textContent=a.dataset.name);a.addEventListener('focus',()=>readout.textContent=a.dataset.name);a.addEventListener('pointerleave',()=>readout.textContent='Choose a doorway');});
 host.querySelector('#hall-unusual').onclick=()=>{const unseen=doors.filter(([id])=>!api.state.visited.includes(id));location.hash='/'+(unseen.length?unseen:doors)[Math.floor(Math.random()*(unseen.length||doors.length))][0];};if(!host.querySelector('.webgl-ready'))cameraControls(host);
}
export function spatialWorkbench(host,api,renderDraft){
 host.innerHTML=`<div class="spatial-scene bench-scene" data-view="center"><div class="scene-world">${svg(`${defs}
 <rect width="1200" height="720" fill="#d4d4c6"/><path d="M0 0H1200L967 106H239Z" fill="#899a8d"/><path d="M0 0L239 106V478L0 720Z" fill="#9caea0"/><path d="M239 106H967V478H239Z" fill="url(#plaster)"/><path d="M1200 0L967 106V478L1200 720Z" fill="#b7bcac"/><path d="M0 720L239 478H967L1200 720Z" fill="url(#stone)"/>
 <path d="M239 478H967L1200 720M239 478L0 720M450 478L350 720M720 478L850 720" fill="none" stroke="#7f8e7e" stroke-width="3"/>
 <path d="M46 139l142 34v231L46 467Z" fill="#f1edcf" stroke="#45695e" stroke-width="13"/><path d="M117 156v280M48 280l139-3" stroke="#9bada0" stroke-width="6"/><path d="M48 467L560 350L975 501L395 667Z" fill="#fff7c4" opacity=".17"/>
 <path d="M299 181h391v170H299Z" fill="#e9e7d8" stroke="#7a877a" stroke-width="5"/><path d="M323 209h340M323 231h180M323 309h340" stroke="#bec4b5"/><path d="M346 282q55-91 112-1t121-13 62 8" stroke="#547d75" stroke-width="2" fill="none"/><text x="322" y="335" font-size="10" fill="#5b6d60" letter-spacing="2">KINEMATIC STUDIES / 02</text>
 <path d="M878 107v138l-89 68" stroke="#485f52" stroke-width="5" fill="none"/><path d="M761 303l43-22 45 33-72 32Z" fill="#355f59" stroke="#244b45" stroke-width="3"/><path d="M778 344l69-30" stroke="#e9db9b" stroke-width="5"/><ellipse cx="754" cy="444" rx="208" ry="100" fill="url(#pool)"/>
 <ellipse cx="661" cy="651" rx="422" ry="45" fill="#34493e" opacity=".3" filter="url(#soft-shadow)"/>
 <path d="M287 467l-23 205h32l42-205M954 479l28 202h28l-6-202" fill="#3d5146"/><path d="M288 608h690" stroke="#536354" stroke-width="10"/>
 <path d="M214 425L876 377L1060 500L294 571Z" fill="url(#wood)" stroke="#5a4b37" stroke-width="4"/><path d="M294 571L1060 500v34L294 610l-80-150v-35Z" fill="#5e4f3a"/><path d="M308 583l330-30v24l-330 33Z" fill="#736148"/><path d="M443 580l75-7" stroke="#b6ae8e" stroke-width="5"/>
 <a href="/games/scribble-engine/" id="bench-instrument" aria-label="Use Scribble Engine" class="physical-object"><title>Use Scribble Engine</title><ellipse cx="758" cy="481" rx="171" ry="31" fill="#2d3f36" opacity=".3"/><path d="M588 424l229-22 112 67-247 32Z" fill="#d3d6c9" stroke="#68796c" stroke-width="4"/><path d="M682 501l247-32v17l-247 33-94-76v-19Z" fill="#7c8c7b"/><path d="M622 427l170-17 85 48-182 24Z" fill="#253b3a" stroke="#9eab99" stroke-width="3"/><ellipse cx="752" cy="446" rx="63" ry="20" fill="none" stroke="#c8d5bb" stroke-width="1"/><path d="M704 445l45-18 31 34" stroke="#b9bba0" stroke-width="7" fill="none"/><circle cx="749" cy="427" r="6" fill="#b28e4b"/><circle cx="704" cy="445" r="7" fill="#839b87"/><path d="M780 458v9" stroke="#d2d8c3" stroke-width="3"/><circle cx="882" cy="467" r="8" fill="#395e52"/><text x="703" y="503" fill="#203e36" font-size="8" letter-spacing="2">SCRIBBLE / 02</text><rect x="628" y="389" width="197" height="126" fill="transparent"/></a>
 <a href="#draft-sheet" id="bench-paper" class="physical-object" aria-label="Open drafting sheet"><title>Open drafting sheet</title><path d="M326 450l147-14 64 49-153 17Z" fill="#eee8d0" stroke="#d3cbb0" stroke-width="2"/><path d="M367 474q40-33 90-8t-25 18" fill="none" stroke="#ab653f" stroke-width="2"/><path d="M414 492l59-45" stroke="#4c6b60" stroke-width="4"/></a>
 <path d="M0 633l90-29 88 29v87H0Z" fill="#576c5b"/><path d="M0 633l90-29 88 29-86 36Z" fill="#76836a"/><path d="M0 648l90 35 87-34" fill="none" stroke="#344d40" stroke-width="4"/>
 <path d="M1131 0h69v720h-35Z" fill="#50695d"/><rect width="1200" height="720" fill="url(#grain)" pointer-events="none"/>`, 'A drawing instrument and loose sheet sit on a deep wooden workbench, lit by a window and articulated lamp. Choose the instrument to move closer.')}</div><div class="scene-caption"><span>Workbench / 02</span><span>Two rotating arms. One line.</span></div></div>
 <div class="spatial-controls bench-actions"><button id="use-instrument" class="primary">Use Scribble Engine</button><button id="open-draft">Open drafting sheet</button><a href="/games/scribble-engine/" target="_blank" rel="noopener">Open instrument separately</a><p>Work stays here when you step back. Reloading starts a new instrument session; export artwork or download a setup before reloading.</p></div>
 <section id="draft-sheet" class="draft-sheet" hidden aria-label="Drafting sheet"><div class="draft-header"><h2>Drafting sheet</h2><button id="close-draft">Put down sheet</button></div><div id="draft-surface"></div></section>`;
 renderDraft(host.querySelector('#draft-surface'),api);
 const rendered=mountScene(host.querySelector('.spatial-scene'),makeWorkbench(api.state),api);
 let approachTimer,instrument;api.cleanup(()=>{clearTimeout(approachTimer);instrument?.close();});const open=event=>{event?.preventDefault();clearTimeout(approachTimer);instrument=getInstrument();instrument.start();rendered?.setCamera('instrument');document.body.classList.add('instrument-open');const enter=()=>{instrument.show(()=>rendered?.setCamera('center'));api.announce('Instrument view opened. Step back returns to this workbench and keeps the session. Separate window remains available.');};if(api.paused())enter();else approachTimer=setTimeout(enter,560);};
 rendered?.links.find(h=>h.id==='instrument')?.link.addEventListener('click',open);host.querySelector('#bench-instrument').onclick=open;host.querySelector('#use-instrument').onclick=open;
 const sheet=host.querySelector('#draft-sheet');const openSheet=event=>{event?.preventDefault();sheet.hidden=false;host.querySelector('#close-draft').focus({preventScroll:true});sheet.scrollIntoView({behavior:api.paused()?'instant':'smooth',block:'start'});};
 rendered?.links.find(h=>h.id==='draft')?.link.addEventListener('click',openSheet);host.querySelector('#bench-paper').onclick=openSheet;host.querySelector('#open-draft').onclick=openSheet;host.querySelector('#close-draft').onclick=()=>{sheet.hidden=true;host.querySelector('#open-draft').focus();};
}
