/* Four room-sized experiments. The full games remain independent and unchanged. */
const q = (host, selector) => host.querySelector(selector);
const mark = (x, y, size = 1, color = '#ed774c') => `<g transform="translate(${x} ${y}) scale(${size})"><path d="M0-35 29-12 20 24-17 32-32-5Z" fill="${color}"/><path d="M0-35 3 0 29-12M3 0 20 24M3 0-17 32M3 0-32-5" fill="none" stroke="#fff9dd" stroke-width="2"/><circle cx="3" cy="0" r="5" fill="#fff9dd"/></g>`;

function specimens(host, api) {
  host.innerHTML = api.svg(`
    <defs>
      <linearGradient id="sp-bg" x2="0" y2="1"><stop stop-color="#b9c9ff"/><stop offset="1" stop-color="#e5dcf6"/></linearGradient>
      <linearGradient id="sp-glass" x2="1" y2=".3"><stop stop-color="#fff" stop-opacity=".5"/><stop offset=".4" stop-color="#b8dff8" stop-opacity=".12"/><stop offset="1" stop-color="#fcffff" stop-opacity=".55"/></linearGradient>
      <radialGradient id="sp-light"><stop stop-color="#fff8b7" stop-opacity=".85"/><stop offset="1" stop-color="#fff8b7" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1000" height="560" fill="url(#sp-bg)"/>
    <path d="M0 402 1000 365V560H0Z" fill="#7076a5"/>
    <path d="M0 468H1000M154 402 85 560M405 390 385 560M663 380 690 560M887 369 991 560" stroke="#8d91bb" fill="none"/>
    <path d="M73 57H927M73 63H927" stroke="#8b95c7"/>
    <g id="sp-lamp" transform="translate(205 88)"><path d="M0-88V-11" stroke="#59618c" stroke-width="6"/><path d="M-32 0-19-23H19L32 0Z" fill="#e9b85f"/><ellipse cy="3" rx="31" ry="7" fill="#fff6b2"/><ellipse cy="155" rx="155" ry="185" fill="url(#sp-light)"/></g>
    <path d="M61 405H939V432H61Z" fill="#4b527d"/>
    <path d="M80 430V507M920 430V507" stroke="#40466f" stroke-width="18"/>
    <g class="sp-jar" transform="translate(206 0)">
      <ellipse cy="390" rx="111" ry="17" fill="#475077" opacity=".2"/>
      <path d="M-72 165Q-99 185-99 227V360Q-99 386 0 386T99 360V227Q99 185 72 165Z" fill="url(#sp-glass)" stroke="#f6fbff" stroke-width="3"/>
      <ellipse cy="165" rx="72" ry="13" fill="#7182ac"/><ellipse cy="160" rx="74" ry="12" fill="#e7ecfa"/>
      <g id="sp-photophile" transform="translate(0 288)"><path d="M-50 31Q-37-37 7-41 54-43 56 16 39 51-7 45Z" fill="#526cdf"/><path d="M-36 18Q-20-24 10-25" stroke="#91b8ff" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="12" cy="-12" r="16" fill="#fff6b5"/><circle id="sp-eye" cx="15" cy="-14" r="7" fill="#30375a"/><path d="M-28 40-37 60M1 43 0 63M30 37 42 52" stroke="#526cdf" stroke-width="9" stroke-linecap="round"/></g>
      <path d="M-81 210V321" stroke="white" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"/>
    </g>
    <g class="sp-jar" transform="translate(500 0)">
      <ellipse cy="390" rx="111" ry="17" fill="#475077" opacity=".2"/>
      <path d="M-70 165Q-96 183-96 224V360Q-96 386 0 386T96 360V224Q96 183 70 165Z" fill="url(#sp-glass)" stroke="#f6fbff" stroke-width="3"/>
      <ellipse cy="165" rx="70" ry="13" fill="#7182ac"/><ellipse cy="160" rx="74" ry="12" fill="#e7ecfa"/>
      <g id="sp-bloom" transform="translate(0 294)"><g id="sp-petals">${Array.from({length:8}, (_,i)=>`<ellipse transform="rotate(${i*45})" cy="-27" rx="15" ry="31" fill="${i%2?'#ffad99':'#ed787f'}"/>`).join('')}</g><circle r="17" fill="#ffe4a5"/><circle cx="-5" cy="-3" r="3" fill="#975057"/><circle cx="5" cy="-3" r="3" fill="#975057"/></g>
      <path d="M-80 210V321" stroke="white" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"/>
      <g id="sp-heat" opacity="0"><path d="M-35 349q-12-16 0-29t0-29M0 357q-12-16 0-29t0-29M35 349q-12-16 0-29t0-29" fill="none" stroke="#ffb37c" stroke-width="3"/></g>
    </g>
    <g class="sp-jar" transform="translate(794 0)">
      <ellipse cy="390" rx="111" ry="17" fill="#475077" opacity=".2"/>
      <path d="M-70 165Q-96 183-96 224V360Q-96 386 0 386T96 360V224Q96 183 70 165Z" fill="url(#sp-glass)" stroke="#f6fbff" stroke-width="3"/>
      <ellipse cy="165" rx="70" ry="13" fill="#7182ac"/><ellipse cy="160" rx="74" ry="12" fill="#e7ecfa"/>
      <g id="sp-ripples" fill="none" stroke="#58bcad" stroke-width="3"><ellipse cy="291" rx="64" ry="30"/><ellipse cy="291" rx="80" ry="45" opacity=".3"/></g>
      <path id="sp-membrane" d="M-58 291Q-26 249 0 282T58 291Q30 331 0 300T-58 291" fill="#8fd7c4" stroke="#d6fff2" stroke-width="3"/>
      <circle id="sp-pearl" cy="286" r="10" fill="#e9ffda"/>
      <path d="M-80 210V321" stroke="white" stroke-opacity=".75" stroke-width="6" stroke-linecap="round"/>
    </g>
    <g fill="#f5efff" font-family="monospace" font-size="15" text-anchor="middle"><text x="206" y="461">01 / FOLLOWS LIGHT</text><text x="500" y="461">02 / UNFOLDS IN WARMTH</text><text x="794" y="461">03 / HOLDS A RIPPLE</text></g>
    <g id="sp-pulse-counter" fill="#dbe1ff" font-family="monospace" font-size="12"><text x="797" y="510" text-anchor="middle">NO TAPS YET</text></g>
  `, 'Three glass specimens: a creature follows the lamp, a flower unfolds with warmth, and a membrane stores the shape of a tap.') + `
    <div class="controls tactile-controls">
      <label>Move the light <input id="sp-light-control" type="range" min="0" max="100" value="20"><output id="sp-light-value">left</output></label>
      <label>Warm the shelf <input id="sp-warmth-control" type="range" min="0" max="100" value="15"><output id="sp-warmth-value">15%</output></label>
      <button id="sp-tap" type="button">Tap the glass</button>
      <p class="tactile-caption" id="sp-response" aria-live="polite">Three specimens. Three different ideas of a response.</p>
    </div>` + api.game('brain-in-a-jar', 'Brain in a Jar', 'Open the full neural-controller toy. Inspect how its sensors and connections shape behavior.');
  let taps = 0;
  const light = q(host,'#sp-light-control');
  light.addEventListener('input', () => {
    const n = Number(light.value);
    q(host,'#sp-lamp').setAttribute('transform',`translate(${150+n*7} 88)`);
    q(host,'#sp-photophile').setAttribute('transform',`translate(${(n-50)*.55} 288) rotate(${(n-50)*.16})`);
    q(host,'#sp-eye').setAttribute('cx',n>50?'20':'6');
    q(host,'#sp-light-value').textContent = n<35?'left':n>65?'right':'overhead';
    q(host,'#sp-response').textContent = 'The blue one follows. The other two have their own interests.';
  });
  const warmth = q(host,'#sp-warmth-control');
  const warm = () => {
    const n = Number(warmth.value);
    q(host,'#sp-petals').setAttribute('transform',`scale(${.34+n*.008}) rotate(${n*.35})`);
    q(host,'#sp-heat').setAttribute('opacity',`${n/140}`);
    q(host,'#sp-warmth-value').textContent = `${n}%`;
  };
  warmth.addEventListener('input', () => { warm(); q(host,'#sp-response').textContent='Warmth opens the coral specimen, one fold at a time.'; });
  q(host,'#sp-tap').addEventListener('click', () => {
    taps++;
    const odd = taps % 2;
    q(host,'#sp-membrane').setAttribute('d',odd?'M-66 291Q-38 325 0 274T66 291Q30 267 0 309T-66 291':'M-58 291Q-26 249 0 282T58 291Q30 331 0 300T-58 291');
    q(host,'#sp-pearl').setAttribute('cy',odd?'305':'277');
    q(host,'#sp-ripples').setAttribute('transform',`translate(0 ${odd?-5:5}) scale(1 ${odd?1.08:.95})`);
    q(host,'#sp-pulse-counter text').textContent = `${taps} TAP${taps===1?'':'S'} HELD`;
    q(host,'#sp-response').textContent = 'The green membrane keeps the ripple. Tap again to turn it inside out.';
  });
  warm();
}

function soft(host, api) {
  host.innerHTML = api.svg(`
    <defs>
      <linearGradient id="sf-bg" x2="0" y2="1"><stop stop-color="#ccf0d9"/><stop offset="1" stop-color="#eef7c6"/></linearGradient>
      <linearGradient id="sf-jelly" x2="1" y2="1"><stop stop-color="#ffb29b"/><stop offset=".48" stop-color="#ef7b83"/><stop offset="1" stop-color="#d94b76"/></linearGradient>
      <linearGradient id="sf-jelly-blue" x2="1" y2="1"><stop stop-color="#a1e5ee"/><stop offset="1" stop-color="#559bbf"/></linearGradient>
      <pattern id="sf-grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" fill="none" stroke="#8bc4b1" stroke-width="1"/></pattern>
    </defs>
    <rect width="1000" height="560" fill="url(#sf-bg)"/>
    <rect y="382" width="1000" height="178" fill="#92c6b6"/><rect y="382" width="1000" height="178" fill="url(#sf-grid)"/>
    <rect x="64" y="58" width="872" height="353" rx="34" fill="#f3f5da" stroke="#65a594" stroke-width="3"/>
    <rect x="93" y="85" width="814" height="283" rx="23" fill="#dde9ce"/>
    <path d="M112 135H875M112 315H875" stroke="#c2d6bb" stroke-dasharray="3 12"/>
    <path d="M325 101V359M652 101V359" stroke="#c2d6bb"/>
    <g fill="#527a71" font-family="monospace" font-size="13"><text x="130" y="117">A / GELATINOUS</text><text x="365" y="117">B / SPRING LOADED</text><text x="692" y="117">C / MOSTLY RIBBON</text></g>
    <ellipse cx="210" cy="346" rx="89" ry="13" fill="#659d8c" opacity=".25"/>
    <g id="sf-gel"><path id="sf-gel-body" d="M141 331Q129 237 149 218 210 189 270 219 289 237 278 331Q211 355 141 331" fill="url(#sf-jelly)" stroke="#e56b7c" stroke-width="2"/><path id="sf-gel-shine" d="M158 235Q201 214 252 234" fill="none" stroke="#ffd4b4" stroke-width="10" stroke-linecap="round"/><ellipse cx="197" cy="294" rx="6" ry="9" fill="#a53d64"/><ellipse cx="226" cy="294" rx="6" ry="9" fill="#a53d64"/></g>
    <path d="M394 344H584" stroke="#528a7c" stroke-width="12" stroke-linecap="round"/>
    <path id="sf-spring" d="M489 333 449 318 529 300 449 282 529 264 449 246 529 228 489 211" fill="none" stroke="#f3b94f" stroke-width="12" stroke-linejoin="round"/>
    <g id="sf-cap"><ellipse cx="489" cy="205" rx="72" ry="25" fill="#6aa7b9"/><ellipse cx="489" cy="197" rx="72" ry="25" fill="url(#sf-jelly-blue)"/><path d="M442 189q31-16 65-4" stroke="#d0ffff" stroke-width="7" fill="none" stroke-linecap="round"/></g>
    <path id="sf-ribbon" d="M701 328C800 324 703 182 782 187S791 326 866 325" fill="none" stroke="#9579ba" stroke-width="23" stroke-linecap="round"/>
    <path id="sf-ribbon-edge" d="M701 323C800 319 703 177 782 182S791 321 866 320" fill="none" stroke="#c7a9dd" stroke-width="5" stroke-linecap="round"/>
    <g id="sf-press"><path d="M116 154H885" stroke="#86b09d" stroke-width="9"/><rect x="159" y="149" width="105" height="21" rx="10" fill="#d5e4c8" stroke="#719c89" stroke-width="3"/><rect x="435" y="149" width="108" height="21" rx="10" fill="#d5e4c8" stroke="#719c89" stroke-width="3"/><rect x="740" y="149" width="105" height="21" rx="10" fill="#d5e4c8" stroke="#719c89" stroke-width="3"/></g>
    <g fill="#355b52" font-family="monospace" font-size="15"><text x="70" y="466">THREE MATERIALS / ONE PRESS</text><text id="sf-readout" x="930" y="466" text-anchor="end">AT REST</text></g>
    <rect x="70" y="488" width="860" height="6" rx="3" fill="#78ab9c"/><rect id="sf-meter" x="70" y="488" width="0" height="6" rx="3" fill="#f9cc67"/>
  `, 'A coral gel, a blue spring cap, and a lilac ribbon sit beneath a shared press. Compress or release them to compare their responses.') + `
    <div class="controls tactile-controls">
      <label>Lower the press <input id="sf-compress" type="range" min="0" max="100" value="0"><output id="sf-amount">0%</output></label>
      <button id="sf-release" type="button">Release the press</button><button id="sf-pluck" type="button">Give them a pluck</button>
      <p class="tactile-caption" id="sf-response" aria-live="polite">The gel spreads. The spring stores. The ribbon finds another way.</p>
    </div>` + api.game('jelly-bench','Jelly Bench','Pull and tune a springy soft body, or guide it through the snack maze.');
  let frame = 0, disposed = false, value = 0, velocity = 0, last = 0;
  const slider = q(host,'#sf-compress');
  function draw(n) {
    const compression = Math.max(-.45, Math.min(1.06,n));
    const sy = 1-compression*.57, sx=1+compression*.28;
    q(host,'#sf-gel').setAttribute('transform',`translate(210 340) scale(${sx} ${sy}) translate(-210 -340)`);
    q(host,'#sf-cap').setAttribute('transform',`translate(0 ${compression*106})`);
    const top = 211+compression*106, span = 333-top;
    const points = Array.from({length:8},(_,i)=>`${i===0?489:i===7?489:i%2?449:529} ${333-(span*i/7)}`).join(' ');
    q(host,'#sf-spring').setAttribute('d','M'+points);
    const ry = 187+compression*92;
    const d=`M701 328C${800+compression*15} 324 ${703-compression*10} ${ry-5} 782 ${ry}S${791+compression*15} 326 866 325`;
    q(host,'#sf-ribbon').setAttribute('d',d);q(host,'#sf-ribbon-edge').setAttribute('d',d);
    q(host,'#sf-press').setAttribute('transform',`translate(0 ${Math.max(0,compression)*106})`);
    q(host,'#sf-meter').setAttribute('width',`${Math.min(860,Math.abs(compression)*860)}`);
  }
  const stop = () => { if(frame) cancelAnimationFrame(frame);frame=0; };
  function bounce(time) {
    if (disposed) return;
    if (api.paused()) {value=0;velocity=0;draw(0);frame=0;return;}
    const dt=Math.min(.025,last?(time-last)/1000:.016);last=time;
    velocity += (-value*85 - velocity*5.4)*dt; value += velocity*dt;
    draw(value);
    if(Math.abs(value)+Math.abs(velocity)<.012) {draw(0);frame=0;q(host,'#sf-readout').textContent='AT REST';return;}
    frame=requestAnimationFrame(bounce);
  }
  slider.addEventListener('input',()=>{
    stop();value=Number(slider.value)/100;velocity=0;draw(value);
    q(host,'#sf-amount').textContent=`${slider.value}%`;q(host,'#sf-readout').textContent=`PRESS ${slider.value}%`;
    q(host,'#sf-response').textContent='One press, three different deformations. Release to see what each remembers.';
  });
  function release(pluck=false){
    stop();slider.value='0';q(host,'#sf-amount').textContent='0%';
    if(pluck){value=.55;velocity=-2;}else velocity=0;
    q(host,'#sf-response').textContent=api.paused()?'Released. Motion is paused; all three materials return to rest.':'Released. The shared pressure becomes a brief wobble.';
    q(host,'#sf-readout').textContent=api.paused()?'AT REST':'RECOVERING';last=0;
    if(api.paused()){value=0;draw(0);}else frame=requestAnimationFrame(bounce);
  }
  q(host,'#sf-release').addEventListener('click',()=>release());q(host,'#sf-pluck').addEventListener('click',()=>release(true));
  api.cleanup(()=>{disposed=true;stop();});
}

function mirrors(host,api){
  host.innerHTML=api.svg(`
    <defs>
      <linearGradient id="mi-bg" x2="1" y2="1"><stop stop-color="#3e466d"/><stop offset="1" stop-color="#262d4b"/></linearGradient>
      <linearGradient id="mi-glass" x2="1" y2="1"><stop stop-color="#b5dfd5"/><stop offset=".5" stop-color="#78aebd"/><stop offset="1" stop-color="#677aab"/></linearGradient>
      <clipPath id="mi-left-clip"><path d="M80 294V142a110 110 0 0 1 220 0v152Z"/></clipPath>
      <clipPath id="mi-middle-clip"><path d="M390 294V142a110 110 0 0 1 220 0v152Z"/></clipPath>
      <clipPath id="mi-right-clip"><path d="M700 294V142a110 110 0 0 1 220 0v152Z"/></clipPath>
    </defs>
    <rect width="1000" height="560" fill="url(#mi-bg)"/>
    <path d="M0 352H1000V560H0Z" fill="#404667"/>
    <path d="M0 560 290 352M230 560 390 352M500 560V352M770 560 610 352M1000 560 710 352M0 417H1000M0 486H1000" stroke="#6c7392" fill="none"/>
    ${[190,500,810].map((x,i)=>`<path d="M${x-121} 305V142a121 121 0 0 1 242 0v163Z" fill="${['#d7a1b3','#c3d6a6','#b5b0e1'][i]}"/><path d="M${x-110} 294V142a110 110 0 0 1 220 0v152Z" fill="url(#mi-glass)"/><path d="m${x-92} 145 99-97M${x-85} 178 129-128" stroke="white" stroke-opacity=".17" stroke-width="8"/><rect x="${x-132}" y="303" width="264" height="17" rx="6" fill="#1f263e"/>`).join('')}
    <g clip-path="url(#mi-left-clip)"><path d="M80 257H300" stroke="#4e819c"/><g id="mi-opposite">${mark(190,220,.9,'#ed967e')}</g></g>
    <g clip-path="url(#mi-middle-clip)"><path d="M390 257H610" stroke="#4e819c"/><g id="mi-stretch">${mark(500,220,.9,'#f1d484')}</g></g>
    <g clip-path="url(#mi-right-clip)"><path d="M700 257H920" stroke="#4e819c"/><g id="mi-delay">${mark(810,220,.9,'#b6b6f1')}</g></g>
    <g font-family="monospace" font-size="14" text-anchor="middle" fill="#edf1e7"><text x="190" y="346">GOES THE OTHER WAY</text><text x="500" y="346">TAKES IT PERSONALLY</text><text x="810" y="346">A MOMENT BEHIND</text></g>
    <path d="M155 458H845" stroke="#252d47" stroke-width="12" stroke-linecap="round"/><path d="M155 458H845" stroke="#7189a2" stroke-width="2" stroke-dasharray="2 12"/>
    <g id="mi-original"><ellipse cx="500" cy="459" rx="49" ry="9" fill="#1c243b" opacity=".55"/>${mark(500,419,1.15)}<path d="M500 458V484" stroke="#f4ca8a" stroke-width="3"/><circle cx="500" cy="490" r="6" fill="#f4ca8a"/></g>
    <text x="500" y="530" font-family="monospace" font-size="14" fill="#c0cbe3" text-anchor="middle">ONE OBJECT. THREE DISAGREEMENTS.</text>
  `,'A faceted object on a rail faces three mirrors. One reflection reverses its travel, one stretches, and one follows late.')+`
    <div class="controls tactile-controls">
      <label>Move the object <input id="mi-position" type="range" min="-100" max="100" value="0"><output id="mi-position-value">center</output></label>
      <label>Turn it <input id="mi-angle" type="range" min="-90" max="90" value="0"><output id="mi-angle-value">0°</output></label>
      <button id="mi-center" type="button">Put it back</button>
      <p class="tactile-caption" id="mi-response" aria-live="polite">Move the object along its rail. Each mirror keeps a different rule.</p>
    </div>`+api.game('mirror-mischief','Mirror Mischief','Arrange mirrors and splitters in a sandbox or three light-routing puzzles.');
  let pos=0,angle=0,delayed=0,delayedAngle=0,frame=0,disposed=false;
  function delayDraw(){q(host,'#mi-delay').setAttribute('transform',`translate(${delayed*.7} 0) rotate(${-delayedAngle} 810 220)`);}
  function catchUp(){
    if(disposed)return;
    if(api.paused()){delayed=pos;delayedAngle=angle;delayDraw();frame=0;return;}
    delayed+=(pos-delayed)*.035;delayedAngle+=(angle-delayedAngle)*.035;delayDraw();
    if(Math.abs(delayed-pos)+Math.abs(delayedAngle-angle)<.15){delayed=pos;delayedAngle=angle;delayDraw();frame=0;return;}
    frame=requestAnimationFrame(catchUp);
  }
  function draw(){
    q(host,'#mi-original').setAttribute('transform',`translate(${pos*3} 0) rotate(${angle} 500 419)`);
    q(host,'#mi-opposite').setAttribute('transform',`translate(${-pos*.7} 0) rotate(${-angle} 190 220)`);
    q(host,'#mi-stretch').setAttribute('transform',`translate(${pos*.45} 0) translate(500 220) scale(${1+Math.abs(pos)/180} ${1-Math.abs(pos)/250}) rotate(${angle}) translate(-500 -220)`);
    q(host,'#mi-position-value').textContent=pos===0?'center':`${Math.abs(pos)}% ${pos<0?'left':'right'}`;
    q(host,'#mi-angle-value').textContent=`${angle}°`;
    q(host,'#mi-response').textContent=api.paused()?'Motion is paused. The late reflection now updates immediately.':'The far mirror catches up in its own time.';
    if(!frame)frame=requestAnimationFrame(catchUp);
  }
  q(host,'#mi-position').addEventListener('input',e=>{pos=Number(e.target.value);draw();});
  q(host,'#mi-angle').addEventListener('input',e=>{angle=Number(e.target.value);draw();});
  q(host,'#mi-center').addEventListener('click',()=>{pos=0;angle=0;q(host,'#mi-position').value='0';q(host,'#mi-angle').value='0';draw();});
  api.cleanup(()=>{disposed=true;if(frame)cancelAnimationFrame(frame);});
}

function traffic(host,api){
  host.innerHTML=api.svg(`
    <defs><linearGradient id="tr-bg" x2="0" y2="1"><stop stop-color="#f6bf69"/><stop offset="1" stop-color="#e68857"/></linearGradient><clipPath id="tr-screen-clip"><rect x="412" y="95" width="499" height="270" rx="10"/></clipPath></defs>
    <rect width="1000" height="560" fill="url(#tr-bg)"/>
    <path d="M0 425H1000V560H0Z" fill="#777576"/><path d="M0 460H1000M0 523H1000" stroke="#9f9290"/><path d="M124 425 80 560M344 425 321 560M565 425 575 560M786 425 835 560" stroke="#9f9290"/>
    <rect x="52" y="63" width="290" height="342" rx="20" fill="#f5e8c9" stroke="#995d47" stroke-width="4"/>
    <text x="77" y="96" fill="#79513f" font-family="monospace" font-size="14">EXHIBIT SIGNAL ROUTER</text>
    <path d="M96 163H170L230 138H286M170 163 230 230H286M170 163 230 321H286" fill="none" stroke="#d2b99b" stroke-width="15" stroke-linejoin="round"/>
    <path id="tr-route" d="M96 163H170L230 138H286" fill="none" stroke="#db6d4c" stroke-width="7" stroke-linejoin="round"/>
    <circle cx="96" cy="163" r="20" fill="#3f655f" stroke="#fff2ce" stroke-width="4"/><circle cx="96" cy="163" r="8" fill="#fbe39b"/>
    <g id="tr-endpoints"><circle cx="286" cy="138" r="18" fill="#db6d4c"/><circle cx="286" cy="230" r="18" fill="#9ca99c"/><circle cx="286" cy="321" r="18" fill="#9ca99c"/></g>
    <g fill="#5e655d" font-family="monospace" font-size="12"><text x="82" y="271">SWITCH</text><text x="82" y="286">POSITION</text></g>
    <circle cx="117" cy="332" r="35" fill="#d3bd97" stroke="#ac8d68" stroke-width="3"/><g id="tr-lever" transform="rotate(-35 117 332)"><path d="M117 332V293" stroke="#536566" stroke-width="12" stroke-linecap="round"/><circle cx="117" cy="293" r="16" fill="#e77a58" stroke="#f9b287" stroke-width="4"/></g>
    <rect x="385" y="69" width="553" height="323" rx="21" fill="#414f57"/>
    <image href="/assets/gameplay-previews/traffic-with-no-excuse.jpg" x="412" y="95" width="499" height="270" preserveAspectRatio="xMidYMid slice" clip-path="url(#tr-screen-clip)"/>
    <rect x="412" y="329" width="499" height="36" fill="#1d3037" fill-opacity=".88"/><text x="662" y="352" text-anchor="middle" fill="#e6f3dd" font-family="monospace" font-size="12">ACTUAL TRAFFIC GAME / STILL CAPTURE</text>
    <path d="M652 393V428M591 432H733" stroke="#475558" stroke-width="12" stroke-linecap="round"/>
    <path d="M358 461H957V504H358Z" fill="#384d50"/><path d="M358 461 401 429H914L957 461" fill="#668078"/>
    <g transform="translate(483 444)"><ellipse rx="27" ry="9" fill="#334f50"/><ellipse id="tr-red-lamp" cy="-5" rx="22" ry="9" fill="#ed9c77"/></g>
    <g transform="translate(656 444)"><ellipse rx="27" ry="9" fill="#334f50"/><ellipse id="tr-gold-lamp" cy="-5" rx="22" ry="9" fill="#8b9984"/></g>
    <g transform="translate(828 444)"><ellipse rx="27" ry="9" fill="#334f50"/><ellipse id="tr-mint-lamp" cy="-5" rx="22" ry="9" fill="#8b9984"/></g>
    <g fill="#d4e1d2" font-family="monospace" font-size="12" text-anchor="middle"><text x="483" y="488">CORAL</text><text x="656" y="488">GOLD</text><text x="828" y="488">MINT</text></g>
    <text x="66" y="458" fill="#fff1d2" font-family="monospace" font-size="12">FOLLOW THE COLORED WIRE.</text><text x="66" y="479" fill="#fff1d2" font-family="monospace" font-size="12">THE EXHIBIT LIGHT OBEYS.</text>
  `,'A three-way switch routes a visible wire to three exhibit lamps. Beside it is an actual still capture of the existing Traffic game.')+`
    <div class="controls tactile-controls">
      <div class="tactile-button-set" role="group" aria-label="Route the exhibit signal"><button type="button" data-signal="0" aria-pressed="true">Coral route</button><button type="button" data-signal="1" aria-pressed="false">Gold route</button><button type="button" data-signal="2" aria-pressed="false">Mint route</button></div>
      <button id="tr-play" type="button" aria-expanded="false" aria-controls="tr-live-screen">Play on the room screen</button>
      <p class="tactile-caption" id="tr-response" aria-live="polite">Coral signal connected. This switch operates the exhibit lamps.</p>
    </div>
    <section id="tr-live-screen" class="tactile-live-screen" hidden aria-label="Existing Traffic game"><div class="tactile-live-head"><p>The full Traffic game — use its own Pause control, or close this screen.</p><button id="tr-close" type="button">Close game screen</button></div><div id="tr-frame-mount"></div></section>
  `+api.game('traffic-with-no-excuse','Traffic With No Excuse','Open the existing Traffic game in its own tab. The room’s switchboard is a separate light exhibit.');
  const colors=['#db6d4c','#e8b94e','#60bfa6'],colorsLit=['#ffab82','#ffdf7d','#a0f2cf'],names=['Coral','Gold','Mint'];
  const routes=['M96 163H170L230 138H286','M96 163H170L230 230H286','M96 163H170L230 321H286'];
  host.querySelectorAll('[data-signal]').forEach(button=>button.addEventListener('click',()=>{
    const n=Number(button.dataset.signal);
    q(host,'#tr-route').setAttribute('d',routes[n]);q(host,'#tr-route').setAttribute('stroke',colors[n]);
    q(host,'#tr-lever').setAttribute('transform',`rotate(${[-35,0,35][n]} 117 332)`);
    q(host,'#tr-endpoints').querySelectorAll('circle').forEach((circle,i)=>circle.setAttribute('fill',i===n?colors[n]:'#9ca99c'));
    ['red','gold','mint'].forEach((color,i)=>q(host,`#tr-${color}-lamp`).setAttribute('fill',i===n?colorsLit[n]:'#8b9984'));
    host.querySelectorAll('[data-signal]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    q(host,'#tr-response').textContent=`${names[n]} signal connected. Follow its wire to the lit exhibit lamp.`;
  }));
  const live=q(host,'#tr-live-screen'), play=q(host,'#tr-play'), mount=q(host,'#tr-frame-mount');
  const close=()=>{mount.replaceChildren();live.hidden=true;play.setAttribute('aria-expanded','false');play.textContent='Play on the room screen';};
  play.addEventListener('click',()=>{
    if(!live.hidden){close();return;}
    const frame=document.createElement('iframe');frame.src='/games/traffic-with-no-excuse/index.html';frame.title='Traffic With No Excuse — full existing game';frame.loading='lazy';
    mount.append(frame);live.hidden=false;play.setAttribute('aria-expanded','true');play.textContent='Close the room screen';
    q(host,'#tr-close').focus();
  });
  q(host,'#tr-close').addEventListener('click',()=>{close();play.focus();});api.cleanup(close);
}

export const tactileRooms={
  specimens:{title:'The specimen room',kicker:'06 / DIFFERENT KINDS OF ALIVE',description:'A shelf of small, particular creatures. Change one thing. Watch who notices.',color:'#c2caff',render:specimens},
  soft:{title:'Soft materials lab',kicker:'07 / PLEASE SQUISH',description:'Nothing here has entirely committed to its shape.',color:'#c2e8c9',render:soft},
  mirrors:{title:'The mirror room',kicker:'08 / AGREEMENT IS OPTIONAL',description:'Put one thing in front of three mirrors. Get three opinions.',color:'#bfc5e7',render:mirrors},
  traffic:{title:'Traffic control',kicker:'09 / SOMEONE LEFT THE SWITCHBOARD ON',description:'A satisfying signal route. A less cooperative road, waiting on the screen.',color:'#f1bd75',render:traffic}
};
