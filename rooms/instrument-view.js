// Keep one instrument session for the lifetime of the room application.
let instance;
export function getInstrument(){
 if(instance)return instance;
 const dialog=document.createElement('dialog');
 dialog.id='instrument-view';dialog.className='instrument-view';dialog.setAttribute('aria-labelledby','instrument-title');
 dialog.innerHTML=`<header><h2 id="instrument-title">Scribble Engine <span>Instrument 02</span></h2><div class="instrument-toolbar"><a href="/games/scribble-engine/" target="_blank" rel="noopener" aria-label="Open a separate Scribble Engine session in a new tab">Separate window</a><button id="step-back">Step back</button></div></header><div class="instrument-surface"><iframe title="Scribble Engine instrument" aria-hidden="true" tabindex="-1"></iframe><section class="instrument-load-panel" role="status" aria-live="polite"><h3 id="instrument-load-title">Opening the instrument</h3><p id="instrument-load-message">The drawing surface will appear here when it is ready.</p><div><button id="instrument-retry" hidden>Retry embedded view</button><a href="/games/scribble-engine/" target="_blank" rel="noopener">Open Scribble separately</a></div><p class="instrument-session-note">A separate window starts its own session. This view stays in place.</p></section></div>`;
 const frame=dialog.querySelector('iframe'),panel=dialog.querySelector('.instrument-load-panel'),retry=dialog.querySelector('#instrument-retry');
 const title=dialog.querySelector('#instrument-load-title'),message=dialog.querySelector('#instrument-load-message');
 let state='idle',wanted=false,everReady=false,timer,deadline,returnToRoom;
 function documentInFrame(){try{return frame.contentDocument;}catch{return null;}}
 function canRetry(){const doc=documentInFrame();return !everReady&&!!doc&&doc.URL==='about:blank'&&!doc.body?.childElementCount;}
 function pause(){const button=documentInFrame()?.getElementById('mobilePause');if(button?.textContent.includes('Pause'))button.click();}
 function setState(next){
  state=next;dialog.dataset.loadState=next;panel.hidden=next==='ready';
  frame.setAttribute('aria-hidden',String(next!=='ready'));frame.tabIndex=next==='ready'?0:-1;frame.inert=next!=='ready';
  retry.hidden=next!=='unavailable'||!canRetry();
  title.textContent=next==='unavailable'?"The instrument hasn't opened here":'Opening the instrument';
  message.textContent=next==='unavailable'?'Open it separately to keep drawing. You can also retry if this view is still empty.':'The drawing surface will appear here when it is ready.';
 }
 function inspect(){
  const doc=documentInFrame();
  if(doc?.documentElement?.dataset.scribbleReady==='true'&&doc.getElementById('view')&&doc.getElementById('mobilePause')){
   everReady=true;clearTimeout(timer);setState('ready');if(!wanted)pause();return true;
  }
  return false;
 }
 function poll(){
  clearTimeout(timer);if(inspect())return;
  if(performance.now()>=deadline){setState('unavailable');return;}
  timer=setTimeout(poll,250);
 }
 function navigate(){
  // Start navigation within the activating click, before the camera timer.
  // The canonical directory URL also avoids a Pages index.html redirect.
  setState('loading');deadline=performance.now()+8000;
  frame.src='/games/scribble-engine/?instrument=1';poll();
 }
 function close(){
  wanted=false;pause();if(dialog.open)dialog.close();
  document.body.classList.remove('instrument-open');returnToRoom?.();returnToRoom=undefined;
 }
 frame.addEventListener('load',inspect);
 frame.addEventListener('error',()=>{if(!everReady){clearTimeout(timer);setState('unavailable');}});
 retry.onclick=()=>{if(inspect()||!canRetry())return;navigate();};
 dialog.querySelector('#step-back').onclick=close;
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 document.body.append(dialog);setState('idle');
 instance={
  start(){wanted=true;if(state==='idle')navigate();else inspect();},
  show(onReturn){returnToRoom=onReturn;if(wanted&&!dialog.open)dialog.showModal();},
  close,
  get state(){return state;}
 };
 return instance;
}
