import {spatialRoom} from './spatial-rooms.js';
import {ROOM_IDS,readState,writeState,rewoundState} from './state.js';
import {mechanicalRooms} from './mechanical.js';
import {wonderRooms} from './wonder.js';
import {tactileRooms} from './tactile.js';
const rooms={...mechanicalRooms,...wonderRooms,...tactileRooms};
const games=[['scribble-engine','Scribble Engine'],['jelly-bench','Jelly Bench'],['brain-in-a-jar','Brain in a Jar'],['mirror-mischief','Mirror Mischief'],['traffic-with-no-excuse','Traffic With No Excuse'],['starfall','Starfall'],['moon-snail','Moon Snail'],['dungeon-reset','Dungeon Reset']];
let storage;try{storage=window.localStorage;}catch{}
let {state,saved}=readState(storage),cleanups=[],current='hall';
const $=id=>document.getElementById(id),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function persist(){saved=writeState(storage,state);}
function announce(text){$('status').textContent=text+(!saved?' Changes last for this visit; browser storage is unavailable.':'');}
function set(patch){Object.assign(state,patch);persist();}
function paused(){return state.paused||reduceMotion.matches;}
function syncMotion(){document.body.classList.toggle('motion-paused',paused());$('pause').setAttribute('aria-pressed',String(paused()));$('pause').textContent=reduceMotion.matches?'Reduced motion':state.paused?'Resume motion':'Pause motion';$('pause').disabled=reduceMotion.matches;}
const api={get state(){return state;},set,announce,cleanup:fn=>cleanups.push(fn),paused,svg:(markup,label)=>`<svg class="room-art" viewBox="0 0 1000 560" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,game:(slug,title,description)=>`<a class="game-link" href="/games/${slug}/index.html" target="_blank" rel="noopener"><img src="/assets/gameplay-previews/${slug}.jpg" alt="Actual ${title} gameplay" loading="lazy"><div><small>FULL EXPERIMENT · OPENS A NEW TAB</small><strong>${title}</strong><p>${description}</p></div><span class="launch-arrow" aria-hidden="true">↗</span></a>`};
function render(focus=false,recordVisit=true){
  cleanups.forEach(fn=>fn());cleanups=[];
  const raw=location.hash.replace(/^#\/?/,'');current=ROOM_IDS.includes(raw)?raw:'hall';
  if(raw&&raw!==current){history.replaceState(null,'',location.pathname+location.search+'#/hall');}
  const room=rooms[current],index=ROOM_IDS.indexOf(current);
  if(recordVisit&&!state.visited.includes(current)){state.visited.push(current);persist();}
  document.title=`${room.title} · Trikzik Labs`;
  document.body.dataset.room=current;document.documentElement.style.setProperty('--accent',room.color);
  $('room-title').textContent=room.title;$('room-kicker').textContent=room.kicker;$('room-description').textContent=room.description;
  $('room-number').textContent=`ROOM ${String(index+1).padStart(2,'0')} / 12`;$('room-select').value=current;
  $('previous').href='#/'+ROOM_IDS[(index+11)%12];$('previous').setAttribute('aria-label',`Previous room: ${rooms[ROOM_IDS[(index+11)%12]].title}`);
  $('next').href='#/'+ROOM_IDS[(index+1)%12];$('next').setAttribute('aria-label',`Next room: ${rooms[ROOM_IDS[(index+1)%12]].title}`);
  announce(current==='hall'?`${state.visited.length} of 12 rooms visited. Choose a doorway or open the room index.`:current==='workbench'?'Choose the instrument or drafting sheet on the bench.':'Explore the marked objects or use the controls beneath the room.');
  room.render($('room-stage'),api);spatialRoom(current,$('room-stage'),api);syncMotion();
  if(focus){$('room-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
$('room-select').innerHTML=ROOM_IDS.map((id,i)=>`<option value="${id}">${String(i+1).padStart(2,'0')} / ${rooms[id].title}</option>`).join('');
$('room-directory').innerHTML=ROOM_IDS.map((id,i)=>`<a href="#/${id}"><span>${String(i+1).padStart(2,'0')}</span>${rooms[id].title}</a>`).join('');
$('game-directory').innerHTML=games.map(([slug,title])=>`<a href="/games/${slug}/index.html" target="_blank" rel="noopener">${title}<span aria-hidden="true">↗</span><span class="sr-only">opens a new tab</span></a>`).join('');
$('room-select').addEventListener('change',e=>location.hash='/'+e.target.value);
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('room-title').focus();$('room-title').scrollIntoView();});
$('directory-open').addEventListener('click',()=>$('directory').showModal());
$('room-directory').addEventListener('click',e=>{if(e.target.closest('a'))$('directory').close();});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
$('reset-open').addEventListener('click',()=>$('reset-dialog').showModal());
let rewindTimer;
$('reset-confirm').addEventListener('click',()=>{$('reset-dialog').close();document.body.classList.add('rewinding');clearTimeout(rewindTimer);state=rewoundState(state);persist();render(false,false);announce('Rewound: rain drained, parcel returned, light centered. Your drawing and museum exhibit are safe.');rewindTimer=setTimeout(()=>document.body.classList.remove('rewinding'),700);});
$('pause').addEventListener('click',()=>{set({paused:!state.paused});syncMotion();announce(state.paused?'Motion paused. Every control still works.':'Motion resumed.');});
reduceMotion.addEventListener('change',syncMotion);
window.addEventListener('hashchange',()=>render(true));
render();
