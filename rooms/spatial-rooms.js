import {mountScene} from './spatial-renderer.js';
import {makeMuseum,makeCounterweight} from './spatial-mechanical-models.js';
import {makeLibrary,makeObservatory,makeConservatory,makePortal} from './spatial-wonder-models.js';
import {makeSpecimens,makeSoft,makeMirrors,makeTraffic} from './spatial-tactile-models.js';

// The established experiment controllers remain the source of truth. Their
// illustrated view is retained for WebGL failure; this adapter gives the same
// controls an authored, three-dimensional room without duplicating mechanics.
const models={museum:makeMuseum,counterweight:makeCounterweight,library:makeLibrary,observatory:makeObservatory,conservatory:makeConservatory,portal:makePortal,specimens:makeSpecimens,soft:makeSoft,mirrors:makeMirrors,traffic:makeTraffic};
const actions={
 museum:{'object':'[data-object]','museum-lamp':'#museum-angle','museum-art':'#/workbench','museum-cable':'#/counterweight'},
 counterweight:{'weight':'#weight-control','route':'#route-blue','museum':'#/museum'},
 library:{'book-0':'[data-book="0"]','book-1':'[data-book="1"]','book-2':'[data-book="2"]','book-fold':'#library-open'},
 observatory:{'sky-turn':'#observatory-turn','marble-drop':'#observatory-drop'},
 conservatory:{'garden-cloud':'#garden-cloud-control','garden-rain':'#garden-rain-control','garden-grow':'#garden-grow','garden-drain':'#garden-drain'},
 portal:{'portal-turn':'#portal-turn','portal-send':'#portal-send','portal-discovery':'#portal-discovery a'},
 specimens:{light:'#sp-light-control',warmth:'#sp-warmth-control',tap:'#sp-tap'},
 soft:{press:'#sf-compress',pluck:'#sf-pluck'},
 mirrors:{'mirror-object':'#mi-position','mirror-angle':'#mi-angle'},
 traffic:{switch:'[data-signal]','traffic-screen':'#tr-play'}
};
const getNumber=(host,id,fallback=0)=>Number(host.querySelector(id)?.value??fallback);
const numbers=(host,id)=>[...(host.querySelector(id)?.getAttribute('transform')||'').matchAll(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)].map(m=>Number(m[0]));

export function spatialRoom(id,host,api){
 if(!models[id])return;
 const illustration=host.querySelector(':scope > .room-art');
 if(!illustration)return;
 const scene=document.createElement('div');scene.className='spatial-scene experiment-scene';scene.dataset.view='center';
 const fallback=document.createElement('div');fallback.className='scene-world';
 illustration.before(scene);fallback.append(illustration);scene.append(fallback);
 const cameraBar=document.createElement('div');cameraBar.className='spatial-controls room-camera-controls';
 cameraBar.innerHTML='<div class="view-controls" role="group" aria-label="Room viewpoints"><button data-view="left" aria-pressed="false">Look left</button><button data-view="center" aria-pressed="true">Room view</button><button data-view="right" aria-pressed="false">Look right</button><button data-view="detail" aria-pressed="false">Inspect</button></div><p>Explore the marked objects. The controls below work with touch or keyboard.</p>';
 scene.after(cameraBar);
 let portalView=0,frame=0,disposed=false,last=0;
 function viewState(){
  switch(id){
   case 'museum':return {object:host.querySelector('[data-object][aria-pressed=true]')?.dataset.object||'cup',angle:getNumber(host,'#museum-angle')};
   case 'library':return {book:Number(host.querySelector('[data-book][aria-pressed=true]')?.dataset.book||0),opening:getNumber(host,'#library-open',74)};
   case 'observatory':return {bearing:getNumber(host,'#observatory-turn',38),marbleY:numbers(host,'#observatory-marble')[1]??423};
   case 'specimens':return {light:getNumber(host,'#sp-light-control',20),warmth:getNumber(host,'#sp-warmth-control',15),taps:parseInt(host.querySelector('#sp-pulse-counter text')?.textContent)||0};
   case 'soft':return {compression:(numbers(host,'#sf-cap')[1]||0)/106};
   case 'mirrors':{const n=numbers(host,'#mi-delay');return {position:getNumber(host,'#mi-position'),angle:getNumber(host,'#mi-angle'),delayedPosition:(n[0]||0)/.7,delayedAngle:-(n[2]||0)};}
   case 'traffic':return {signal:Number(host.querySelector('[data-signal][aria-pressed=true]')?.dataset.signal||0),screenOpen:!host.querySelector('#tr-live-screen')?.hidden};
   case 'portal':return {view:portalView};
   default:return {};
  }
 }
 const rendered=mountScene(scene,models[id](api.state,viewState()),api);
 if(!rendered){cameraBar.hidden=true;return;}
 function refresh(time){
  frame=0;if(disposed)return;
  // Brief spring / reflection responses are capped at 30 scene updates/second.
  // The original simulation retains its own timing and no idle loop is added.
  if(time-last<32){frame=requestAnimationFrame(refresh);return;}
  last=time;rendered.update(models[id](api.state,viewState()));bindHotspots();
 }
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(refresh);}
 function activate(pick,href){
  let selector=actions[id]?.[pick]||href;
  if(selector?.startsWith('#/')){location.hash=selector;return;}
  if(id==='museum'&&pick==='object'){
   rendered.setCamera('detail');
   const all=[...host.querySelectorAll('[data-object]')],current=all.findIndex(b=>b.getAttribute('aria-pressed')==='true');all[(current+1)%all.length]?.click();return;
  }
  if(id==='traffic'&&pick==='switch'){
   rendered.setCamera('detail');
   const all=[...host.querySelectorAll('[data-signal]')],current=all.findIndex(b=>b.getAttribute('aria-pressed')==='true');all[(current+1)%all.length]?.click();return;
  }
  if(id==='counterweight'&&pick==='route')selector=api.state.lightRoute==='blue'?'#route-amber':'#route-blue';
  let control;try{control=selector&&host.querySelector(selector);}catch{}
  if(!control)return;
  rendered.setCamera('detail');
  if(control.matches('button,a')){control.click();return;}
  control.focus({preventScroll:true});control.closest('.controls')?.scrollIntoView({block:'nearest',behavior:'instant'});
  api.announce('Adjust '+(control.closest('label')?.childNodes[0]?.textContent?.trim()||'the selected control')+'. Arrow keys make small adjustments.');
 }
 function bindHotspots(){for(const h of rendered.links){h.link.onclick=e=>{if(e.defaultPrevented)return;e.preventDefault();activate(h.id,h.href);};}}
 bindHotspots();
 const observer=new MutationObserver(schedule);observer.observe(illustration,{subtree:true,attributes:true,childList:true,characterData:true});
 const change=e=>{if(id==='portal'&&e.type==='click'&&e.target.closest('#portal-turn'))portalView=(portalView+1)%3;queueMicrotask(schedule);};
 host.addEventListener('input',change);host.addEventListener('click',change);
 api.cleanup(()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('input',change);host.removeEventListener('click',change);});
}
