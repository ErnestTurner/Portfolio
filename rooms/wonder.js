const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const controls = (content) => `<div class="controls wonder-controls">${content}</div>`;
const starfield = (count, width = 1000, height = 430) => Array.from({ length: count }, (_, i) => {
  const x = (i * 137.51 + 39) % width;
  const y = (i * i * 17.71 + 31) % height;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 11 === 0 ? 2.1 : 1}" fill="${i % 5 === 0 ? '#f4b8ae' : '#d6eee6'}" opacity="${0.3 + (i % 6) * 0.11}"/>`;
}).join('');

function library(host, api) {
  let selected = 0;
  let opening = 74;
  const names = ['Tide atlas', 'Folded weather', 'Night garden'];
  const worlds = [
    `<path d="M234 392 286 275 358 385Z" fill="#95d5cd"/><path d="M286 275 300 401 358 385Z" fill="#457b85"/>
    <path d="M319 402Q355 300 407 347T505 339T609 326T746 392L719 427 500 450Z" fill="#72c4c5"/>
    <path d="M316 402Q366 351 405 387T498 379T600 361T751 401L695 443 500 465Z" fill="#427d9b"/>
    <path d="M352 415Q405 380 455 415T559 407T693 417L628 452 500 465Z" fill="#294f78"/>
    <path d="M474 345 531 334 514 365 487 364Z" fill="#f0c497"/><path d="M501 277V351M504 279 543 323 505 329" stroke="#fff1d4" stroke-width="3" fill="#fff1d4"/>
    <path d="M656 292V370M651 292H672L666 274H653Z" stroke="#e9c67d" stroke-width="5" fill="#e9c67d"/>
    <path d="m633 375 49-12-8 43-38 7Z" fill="#e2a990"/><path d="M656 287 583 311 589 327Z" fill="#f8eac1" opacity=".5"/>
    <path d="M366 264q16-20 31 0m-5-13q14-18 29 0" fill="none" stroke="#3b6277" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="M249 402 386 199 505 423Z" fill="#dd9f9c"/><path d="M386 199 397 430 505 423Z" fill="#a96589"/>
    <path d="m386 199-47 70 47-18 38 20Z" fill="#f8e6d8"/>
    <path d="M422 429 585 139 744 415Z" fill="#81a8ae"/><path d="M585 139 592 446 744 415Z" fill="#437687"/>
    <path d="m585 139-55 97 52-23 39 25Z" fill="#f6e6d8"/>
    <path d="M288 419 408 319 519 455Z" fill="#e4ba7d"/><path d="M408 319 414 450 519 455Z" fill="#cb8f76"/>
    <path d="M579 441 676 300 760 412Z" fill="#a3bda4"/><path d="M676 300 677 429 760 412Z" fill="#61898c"/>
    <path d="M259 224c-15-23 9-44 31-29 6-35 52-34 57-7 29-15 50 17 27 35Z" fill="#fff0d6"/>
    <path d="M671 218c-17-20 8-41 29-27 5-32 43-30 50-6 23-11 41 12 24 31Z" fill="#f4cbd1"/>
    <path d="m457 351 26-36 16 21 35-52" fill="none" stroke="#f9eccd" stroke-width="4" stroke-dasharray="5 5"/>`,
    `<path d="M276 409Q369 321 500 396T725 402L648 445 500 463Z" fill="#9badd4"/>
    <path d="M317 421Q419 362 509 419T711 410L647 451 500 463Z" fill="#686fa3"/>
    <circle cx="538" cy="219" r="57" fill="#ffe6ae"/><circle cx="555" cy="207" r="53" fill="#c4b7cb"/>
    <path d="M361 411v-94m0 62q-47-55-49-25 11 33 49 25m0-29q29-44 39-23-3 29-39 23" stroke="#6b9a9d" stroke-width="7" fill="#9fc6b2"/>
    <path d="M649 414v-117m0 65q45-54 48-27-4 31-48 27m0 28q-43-44-43-19 4 28 43 19" stroke="#87b3a8" stroke-width="6" fill="#a4ceb2"/>
    <g fill="#efd1d8"><circle cx="361" cy="302" r="22"/><circle cx="340" cy="318" r="18"/><circle cx="381" cy="320" r="19"/><circle cx="649" cy="284" r="27"/><circle cx="628" cy="300" r="20"/><circle cx="670" cy="302" r="20"/></g>
    <g fill="#f8d375"><circle cx="361" cy="318" r="10"/><circle cx="649" cy="302" r="11"/><circle cx="433" cy="304" r="3"/><circle cx="598" cy="371" r="3"/><circle cx="445" cy="394" r="4"/><circle cx="304" cy="274" r="3"/></g>
    <path d="m437 424 4-36m-4 17-13-11m16 0 13-17" stroke="#d2c7e4" stroke-width="3" fill="none"/>`
  ];
  host.innerHTML = api.svg(`<defs>
    <linearGradient id="library-wall" x2="0" y2="1"><stop stop-color="#e9d9cc"/><stop offset="1" stop-color="#cbb6ca"/></linearGradient>
    <linearGradient id="library-page" x2="1" y2="0"><stop stop-color="#f8edd7"/><stop offset=".5" stop-color="#fff6e4"/><stop offset="1" stop-color="#ddc7ac"/></linearGradient>
  </defs><rect width="1000" height="560" fill="url(#library-wall)"/>
  <path d="M0 445Q500 396 1000 445V560H0Z" fill="#625268"/><path d="M0 473Q500 422 1000 473" fill="none" stroke="#8b7288" stroke-width="2"/>
  <g opacity=".55" fill="none" stroke="#a28a9f" stroke-width="2"><path d="M80 93h190v222H80Zm650 0h190v222H730"/><path d="M100 111h152v186H100Zm648 0h272"/></g>
  <g transform="translate(45 362) rotate(-8)"><rect width="129" height="24" rx="3" fill="#467a80"/><path d="M10 4h111v16H10" fill="#d9cdb7"/><rect x="12" y="-31" width="116" height="27" rx="3" fill="#b66c73"/><path d="M24-26h96v17H24" fill="#f3d8bd"/><rect x="24" y="-61" width="94" height="24" rx="3" fill="#ddac68"/></g>
  <ellipse cx="510" cy="476" rx="336" ry="39" fill="#332840" opacity=".25"/>
  <path d="m176 409 287-38 44 15 43-15 278 38-38 75-284 22-285-22Z" fill="#a55962"/>
  <path d="m186 400 276-43 44 23 46-23 266 43-36 70-276 24-278-24Z" fill="#d8bca8"/>
  <path d="m192 390 270-44 44 26 46-26 260 44-35 69-271 27-273-27Z" fill="url(#library-page)"/>
  <path d="M506 374v111m-268-38 228-27m87 0 218 27" stroke="#c3a890" stroke-width="2" fill="none"/>
  <g id="library-world">${worlds[0]}</g>
  <path d="m508 486 25-3-2 45-12-10-12 11Z" fill="#dc9a72"/>
  <g fill="#f2e5d2" font-family="ui-monospace,monospace" font-size="12" letter-spacing="3"><text x="52" y="58">THE FOLDING COLLECTION</text><text x="805" y="521">VOL. <tspan id="library-volume">01</tspan></text></g>`, 'An open paper book becomes a layered miniature landscape as its pages unfold.') + controls(`
  <fieldset class="wonder-book-picker"><legend>Take a book off the shelf</legend><div class="wonder-button-row">${names.map((name, i) => `<button type="button" data-book="${i}" aria-pressed="${i === 0}"><span class="wonder-book-icon book-${i}" aria-hidden="true"></span>${name}</button>`).join('')}</div></fieldset>
  <label class="wonder-range">Unfold the pages <output id="library-open-output">${opening}%</output><input id="library-open" type="range" min="0" max="100" value="${opening}"/></label>
  <p class="wonder-caption" id="library-note">A tide small enough to keep between pages.</p>`);
  const world = host.querySelector('#library-world');
  function paint() {
    const amount = opening / 100;
    world.setAttribute('transform', `translate(500 440) scale(1 ${amount}) translate(-500 -440)`);
    world.style.opacity = String(Math.max(0, amount * 1.4));
    host.querySelector('#library-open-output').textContent = `${opening}%`;
  }
  host.querySelector('#library-open').addEventListener('input', (event) => { opening = Number(event.target.value); paint(); });
  host.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    selected = Number(button.dataset.book);
    world.innerHTML = worlds[selected];
    opening = 100;
    host.querySelector('#library-open').value = opening;
    host.querySelector('#library-volume').textContent = `0${selected + 1}`;
    host.querySelector('#library-note').textContent = ['A tide small enough to keep between pages.', 'Three mountains. One unusually portable weather system.', 'The flowers keep their own small moons.'][selected];
    host.querySelectorAll('[data-book]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    paint();
    api.announce(`${names[selected]} unfolded into a paper landscape.`);
  }));
  paint();
}

function observatory(host, api) {
  let bearing = 38;
  let dropping = false;
  let raf = 0;
  host.innerHTML = api.svg(`<defs>
    <radialGradient id="observatory-sky" cx=".6" cy=".32" r=".8"><stop stop-color="#33486d"/><stop offset=".55" stop-color="#202d4e"/><stop offset="1" stop-color="#121d35"/></radialGradient>
    <linearGradient id="observatory-haze" x2="1" y2="1"><stop stop-color="#d2aecf" stop-opacity="0"/><stop offset=".5" stop-color="#d2aecf" stop-opacity=".2"/><stop offset="1" stop-color="#7dc9bd" stop-opacity="0"/></linearGradient>
    <radialGradient id="observatory-marble-glow"><stop stop-color="#fffde3"/><stop offset=".35" stop-color="#d2f6cf"/><stop offset=".7" stop-color="#7ecdc3"/><stop offset="1" stop-color="#7ecdc3" stop-opacity="0"/></radialGradient>
  </defs><rect width="1000" height="560" fill="url(#observatory-sky)"/>
  <path d="M-80 388Q248 51 504 209T1080 87" fill="none" stroke="url(#observatory-haze)" stroke-width="135"/>
  ${starfield(118)}
  <g fill="none" stroke="#6d8ca7" opacity=".22"><circle cx="500" cy="306" r="230"/><circle cx="500" cy="306" r="165"/><path d="M270 306h460M500 76v460"/><path d="M337 143 663 469M337 469 663 143"/></g>
  <circle cx="799" cy="130" r="34" fill="#f6ddbc"/><circle cx="810" cy="120" r="31" fill="#283a5b"/>
  <g id="observatory-constellation" fill="#f6edd6" stroke="#c0d9dc"><path id="observatory-lines" fill="none" stroke-width="1.5" opacity=".65"/><g id="observatory-stars"></g></g>
  <path d="M0 485Q125 409 220 460T420 472T635 441T1000 476V560H0Z" fill="#192b3d"/>
  <path d="M0 516Q220 464 407 501T727 489T1000 508V560H0Z" fill="#263e4c"/>
  <path d="M0 550h1000" stroke="#4e6870" stroke-width="20"/>
  <g transform="translate(190 410)"><path d="m0 0-28 127m28-127 55 127m-55-127 4 131" stroke="#a2b0a9" stroke-width="5"/><circle r="15" fill="#bdc6b5"/><g transform="rotate(-34)"><rect x="-50" y="-14" width="164" height="28" rx="4" fill="#6e928c"/><path d="M105-20h17v40h-17Z" fill="#d9d9ba"/><ellipse cx="122" cy="0" rx="7" ry="20" fill="#445d68"/><path d="M-58-9h12V9h-12Z" fill="#d2c5a6"/></g></g>
  <ellipse cx="710" cy="502" rx="70" ry="13" fill="#101d2c"/><path d="M665 501v-41h90v41" fill="#536969"/><ellipse cx="710" cy="460" rx="45" ry="10" fill="#94a59a"/>
  <g id="observatory-marble" transform="translate(710 423)"><circle r="38" fill="url(#observatory-marble-glow)"/><circle r="10" fill="#edffda"/><circle cx="-3" cy="-4" r="3" fill="white"/></g>
  <path d="M683 550h54" stroke="#9bccc3" stroke-width="2"/>
  <g fill="#b4c7cc" font-family="ui-monospace,monospace" font-size="12" letter-spacing="3"><text x="48" y="48">A WINDOW LEFT OPEN</text><text x="780" y="526">NO ROOF REQUIRED</text></g>`, 'A telescope, a changing constellation, and a luminous marble beneath a wide, quiet night sky.') + controls(`
  <label class="wonder-range">Turn the sky <output id="observatory-bearing">${bearing}°</output><input type="range" id="observatory-turn" min="0" max="360" value="${bearing}"/></label>
  <button type="button" id="observatory-drop">Drop the luminous marble ↓</button>
  <p class="wonder-caption" id="observatory-note">Gravity has a surprisingly good return policy.</p>`) + api.game('starfall', 'Starfall', 'Spend light, recover fragments, and survive the eclipse.');
  function paintSky() {
    const positions = Array.from({ length: 7 }, (_, i) => {
      const angle = i * .77 + bearing * Math.PI / 180;
      return [490 + Math.cos(angle) * (96 + i * 9), 253 + Math.sin(angle) * (66 + i * 7)];
    });
    host.querySelector('#observatory-lines').setAttribute('d', positions.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
    host.querySelector('#observatory-stars').innerHTML = positions.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 + 2}"/><path d="M${x - 7} ${y}h14M${x} ${y - 7}v14" stroke-width=".7" opacity=".6"/>`).join('');
    host.querySelector('#observatory-bearing').textContent = `${bearing}°`;
  }
  host.querySelector('#observatory-turn').addEventListener('input', (event) => { bearing = Number(event.target.value); paintSky(); });
  const marble = host.querySelector('#observatory-marble');
  const drop = host.querySelector('#observatory-drop');
  function finish() {
    dropping = false;
    marble.setAttribute('transform', 'translate(710 94)');
    drop.disabled = false;
    drop.textContent = 'Drop it again ↓';
    host.querySelector('#observatory-note').textContent = 'It came back from above. The ceiling declines to explain.';
    api.announce('The marble fell below the floor and returned from above. It is now glowing at the top of the room.');
  }
  drop.addEventListener('click', () => {
    if (dropping) return;
    dropping = true;
    drop.disabled = true;
    host.querySelector('#observatory-note').textContent = 'Going down…';
    if (api.paused()) { finish(); return; }
    let start = 0;
    let previous = 0;
    const fromY = Number(marble.getAttribute('transform').match(/710\s+([\d.]+)/)?.[1]) || 423;
    function frame(time) {
      if (!start) { start = time; previous = time; }
      if (api.paused()) { start += time - previous; previous = time; raf = requestAnimationFrame(frame); return; }
      previous = time;
      const elapsed = time - start;
      let y;
      if (elapsed < 650) y = fromY + (650 - fromY) * Math.pow(elapsed / 650, 2);
      else if (elapsed < 1100) y = -70;
      else if (elapsed < 1950) {
        y = -70 + 164 * (1 - Math.pow(1 - (elapsed - 1100) / 850, 3));
        host.querySelector('#observatory-note').textContent = '…and coming down again?';
      } else { finish(); return; }
      marble.setAttribute('transform', `translate(710 ${y})`);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  });
  api.cleanup(() => cancelAnimationFrame(raf));
  paintSky();
}

function conservatory(host, api) {
  let rain = clamp(api.state.rain, 0, 100);
  let clouds = clamp(api.state.clouds ?? 2, 0, 3);
  let plant = clamp(api.state.plant, 0, 2);
  let gardenDrained = api.state.gardenDrained === true;
  const plantNames = ['Fan leaves', 'Umbrella flowers', 'Spiral ferns'];
  host.innerHTML = api.svg(`<defs>
    <linearGradient id="garden-sky" x2="0" y2="1"><stop stop-color="#afcfd1"/><stop offset="1" stop-color="#edf1d5"/></linearGradient>
    <linearGradient id="garden-pane" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs><rect width="1000" height="560" fill="#416e68"/>
  <path d="M65 459V177Q65 53 500 30 935 53 935 177v282Z" fill="url(#garden-sky)"/>
  <circle cx="763" cy="151" r="55" fill="#f9e8a0"/>
  <path d="M65 459V177Q65 53 500 30 935 53 935 177v282ZM500 31v425M283 64v391M718 64v391M67 187h865M65 330h870" fill="none" stroke="#5b8c7d" stroke-width="9"/>
  <path d="m95 210 119-24-119 133Zm225-104 147-39-147 98Zm429 102 143-11-143 116Z" fill="url(#garden-pane)"/>
  <path d="M0 465h1000v95H0Z" fill="#b5bba1"/><path d="M0 465h1000" stroke="#315d58" stroke-width="19"/>
  <g stroke="#939e88" stroke-width="1.5" opacity=".7"><path d="m0 515 1000-15M185 465l-55 95m257-95-22 95m250-95 33 95m180-95 60 95"/></g>
  <g id="garden-clouds"></g><g id="garden-rain" stroke="#77aaaf" stroke-linecap="round"></g>
  <path d="m166 406 19 90h124l19-90Z" fill="#cd8a70"/><ellipse cx="247" cy="406" rx="81" ry="17" fill="#b07460"/><ellipse cx="247" cy="404" rx="65" ry="10" fill="#665344"/>
  <path d="m417 420 15 87h124l19-87Z" fill="#efce9a"/><ellipse cx="496" cy="420" rx="79" ry="16" fill="#d1aa7a"/><ellipse cx="496" cy="417" rx="65" ry="10" fill="#665344"/>
  <path d="m680 402 17 95h133l18-95Z" fill="#649b98"/><ellipse cx="764" cy="402" rx="84" ry="17" fill="#427b79"/><ellipse cx="764" cy="400" rx="67" ry="10" fill="#665344"/>
  <g id="garden-plants"></g>
  <ellipse id="garden-water" cx="499" cy="527" rx="150" ry="9" fill="#77aeb5" opacity=".65"/>
  <g transform="translate(899 510)"><ellipse rx="37" ry="12" fill="#4b6968"/><path d="M-23-5h46M-25 1h50M-17 7h34" stroke="#9eb9a6" stroke-width="2"/></g>
  <path id="garden-drain-line" d="M636 527q147 14 230-15" fill="none" stroke="#7aafb3" stroke-width="6" opacity="0"/>
  <g fill="#e1ead6" font-family="ui-monospace,monospace" font-size="12" letter-spacing="3"><text x="35" y="34">INDOOR WEATHER</text></g>`, 'A glass conservatory with three pots. Clouds, rain, and plant shapes change as you compose the weather.') + controls(`
  <label class="wonder-range">Clouds <output id="garden-cloud-output">${clouds}</output><input type="range" id="garden-cloud-control" min="0" max="3" step="1" value="${clouds}"/></label>
  <label class="wonder-range">Rain <output id="garden-rain-output">${rain}%</output><input type="range" id="garden-rain-control" min="0" max="100" value="${rain}"/></label>
  <button type="button" id="garden-grow">Change plants: ${plantNames[(plant + 1) % 3]}</button><button type="button" id="garden-drain">Drain the floor → Hall</button>
  <p class="wonder-caption" id="garden-note">${gardenDrained ? 'The floor has drained into the <a href="#/hall">Hall</a>. Change the rain to collect more water.' : 'Choose the weather. The plants will find a use for it.'}</p>`) + api.game('moon-snail', 'Moon Snail', 'Catch marshmallows in bubbles and feed the moon.');
  function plantArt(x, y, index) {
    const growth = 0.76 + rain * .0024;
    const kind = (plant + index) % 3;
    const stem = `<path d="M0 0Q-8-85 0-175" fill="none" stroke="#427766" stroke-width="7"/>`;
    const shapes = [
      `<path d="M-2-52C-85-52-102-124-81-136-55-147-8-113-2-52Z" fill="#5b9077"/><path d="M-2-82C59-80 94-147 70-157 37-172 0-121-2-82Z" fill="#80b18a"/><path d="M0-139C-51-172-45-222-18-224 10-223 25-180 0-139Z" fill="#92b78b"/><path d="M-1-55-70-126m69 45 59-67" stroke="#bdd1a4" stroke-width="2" fill="none"/>`,
      `<path d="M0-65q-56-50-64-22 13 34 64 22m0-43q47-49 58-23-7 31-58 23" fill="#77a07a"/><path d="M-68-175Q0-254 68-175Z" fill="${rain > 50 ? '#eeb2ab' : '#ddad6d'}"/><path d="M-68-175Q0-159 68-175" stroke="#ad7c7d" stroke-width="3" fill="none"/><circle cx="0" cy="-222" r="7" fill="#f2db93"/>`,
      `<path d="M0-30q-76-50-46-99 29-45 51-4 15 30-9 34-18 0-13-19M0-95q66-17 64-66-3-43-34-26-26 14-10 31 11 10 17-4" fill="none" stroke="#87a878" stroke-width="12" stroke-linecap="round"/><path d="M0-151q-30-43-12-62 16-16 27 2 11 21-5 22" fill="none" stroke="#c4c78e" stroke-width="10" stroke-linecap="round"/>`
    ];
    return `<g transform="translate(${x} ${y}) scale(${growth})">${stem}${shapes[kind]}</g>`;
  }
  function paint() {
    host.querySelector('#garden-clouds').innerHTML = Array.from({ length: clouds }, (_, i) => `<g transform="translate(${240 + i * 251} ${140 + (i % 2) * 29})"><path d="M-91 17C-119-19-66-46-44-21-39-76 36-72 43-28 89-45 116-4 88 20Z" fill="${rain > 50 ? '#93b0b6' : '#f7f1d9'}"/><path d="M-81 21h159" stroke="#bfd0c9" stroke-width="4"/></g>`).join('');
    const actualRain = clouds ? rain : 0;
    host.querySelector('#garden-rain').innerHTML = Array.from({ length: Math.round(actualRain * .8) }, (_, i) => {
      const x = 150 + (i * 57) % Math.min(730, clouds * 250);
      const y = 200 + (i * 71) % 237;
      return `<path d="m${x} ${y}-4 11" stroke-width="${i % 3 === 0 ? 2 : 1}" opacity="${.35 + (i % 5) * .1}"/>`;
    }).join('');
    host.querySelector('#garden-plants').innerHTML = plantArt(247, 405, 0) + plantArt(496, 418, 1) + plantArt(764, 401, 2);
    host.querySelector('#garden-water').setAttribute('rx', String(25 + rain * 2.2));
    host.querySelector('#garden-water').setAttribute('opacity', gardenDrained ? '0' : String(rain / 150));
    host.querySelector('#garden-drain-line').setAttribute('opacity', gardenDrained ? '.8' : '0');
    host.querySelector('#garden-drain').disabled = rain === 0 || gardenDrained;
    host.querySelector('#garden-rain-output').textContent = `${rain}%`;
    host.querySelector('#garden-cloud-output').textContent = clouds;
    host.querySelector('#garden-grow').textContent = `Change plants: ${plantNames[(plant + 1) % 3]}`;
    api.set({ rain, clouds, plant, gardenDrained });
  }
  host.querySelector('#garden-cloud-control').addEventListener('input', event => {
    clouds = Number(event.target.value);
    if (clouds === 0) { rain = 0; gardenDrained = false; host.querySelector('#garden-rain-control').value = rain; }
    paint();
    host.querySelector('#garden-note').textContent = clouds ? `${clouds} cloud${clouds > 1 ? 's' : ''} borrowed from outside.` : 'The sun has the room to itself.';
  });
  host.querySelector('#garden-rain-control').addEventListener('input', event => {
    rain = Number(event.target.value);
    gardenDrained = false;
    if (rain > 0 && clouds === 0) { clouds = 1; host.querySelector('#garden-cloud-control').value = clouds; }
    paint();
    host.querySelector('#garden-note').textContent = rain ? 'The leaves open. Water collects on the floor, ready to drain into the Hall.' : 'The rain has stopped. The leaves settle.';
  });
  host.querySelector('#garden-grow').addEventListener('click', () => {
    plant = (plant + 1) % 3;
    paint();
    api.announce(`The arrangement now starts with ${plantNames[plant].toLowerCase()}.`);
  });
  host.querySelector('#garden-drain').addEventListener('click', () => {
    if (rain === 0 || gardenDrained) return;
    gardenDrained = true;
    api.set({ hallWater: rain, gardenDrained });
    paint();
    host.querySelector('#garden-note').innerHTML = 'The floor drains into a puddle in the <a href="#/hall">Hall</a>. A paper boat has found it.';
    api.announce('Water drained into the Hall. A paper boat is now floating in its puddle.');
  });
  paint();
}

function portal(host, api) {
  let view = 0;
  const names = ['A sea above the clouds', 'A station for the moon', 'The room after the adventure'];
  const destinations = [
    `<rect x="342" y="76" width="316" height="390" fill="#91b7ca"/><circle cx="570" cy="159" r="38" fill="#ffe9b5"/>
    <path d="M322 281Q399 235 470 271T679 258V475H322Z" fill="#c4d8d1"/><path d="M322 325Q410 291 479 321T679 311V475H322Z" fill="#7aa9b6"/><path d="M322 389Q425 350 509 379T679 356V475H322Z" fill="#477b95"/>
    <path d="M402 246h62l-13 14h-35Z" fill="#e4b99c"/><path d="M435 194v54m3-53 29 39h-29" stroke="#fff1ce" stroke-width="3" fill="#fff1ce"/>
    <path d="M335 429q54-38 101-6t99-3 136 3v50H335Z" fill="#d6e3d4"/>`,
    `<rect x="342" y="76" width="316" height="390" fill="#333650"/><g transform="translate(342 76)">${starfield(35, 316, 320)}</g><circle cx="523" cy="200" r="80" fill="#efcfad"/><circle cx="495" cy="180" r="15" fill="#ddbd9f"/><circle cx="550" cy="222" r="23" fill="#e1c3a2"/>
    <path d="M341 403 658 358v110H341Z" fill="#8c7192"/><path d="m350 435 308-46m-306 57 305-45" stroke="#e6bd9b" stroke-width="4"/>
    <path d="M397 414V301m-16 0h45v-33h-45Z" stroke="#e1b4a4" stroke-width="5" fill="#a87c8c"/><path d="m379 266 55-2" stroke="#f5d2ae" stroke-width="3"/>
    <path d="m550 389 13-56h58l17 42" fill="#d2a68d"/><path d="m565 341-4 34 64-10-10-24Z" fill="#55516c"/>`,
    `<rect x="342" y="76" width="316" height="390" fill="#49586a"/><path d="M342 76h316v320H342Z" fill="#707b80"/>
    <g stroke="#59656c" stroke-width="3" fill="none"><path d="M342 139h316M342 202h316M342 265h316M342 328h316M390 76v63m115-63v63m-65 0v63m126-63v63m-176 0v63m115-63v63m-65 0v63m126-63v63"/></g>
    <path d="M342 396h316v70H342Z" fill="#9a9d8d"/><path d="m352 466 99-70m71 70 27-70m82 70-22-70" stroke="#798878" stroke-width="2"/>
    <path d="M438 394V232q0-62 62-62t62 62v162" fill="#354459"/><path d="M454 394V234q0-47 46-47t46 47v160Z" fill="#bdc4a5"/>
    <path d="m480 394 45-126m-46 124-29-10m27 15 31 11" stroke="#9a705e" stroke-width="7"/><path d="m448 379 61 24-11 18-61-23Z" fill="#d2ba83"/>
    <path d="M576 376h32l-4 36h-24Z" fill="#7a9f9d"/><path d="M578 375q15-29 28 0" fill="none" stroke="#acc4b4" stroke-width="3"/>`
  ];
  host.innerHTML = api.svg(`<defs>
    <linearGradient id="portal-wall" x2="1" y2="1"><stop stop-color="#d4c4cf"/><stop offset="1" stop-color="#a0bcc4"/></linearGradient>
    <linearGradient id="portal-edge" x2="1" y2="0"><stop stop-color="#ad638a"/><stop offset=".5" stop-color="#ecd5aa"/><stop offset="1" stop-color="#7eaaa9"/></linearGradient>
    <clipPath id="portal-opening"><path d="M342 466V144q0-68 68-68h180q68 0 68 68v322Z"/></clipPath>
  </defs><rect width="1000" height="560" fill="url(#portal-wall)"/>
  <path d="M0 423h1000v137H0Z" fill="#8b98a0"/>
  <path d="M0 423h1000M500 423v137M260 423l-87 137m567-137 87 137M0 479h1000" fill="none" stroke="#aeb9b7" stroke-width="1.5"/>
  <ellipse cx="510" cy="492" rx="227" ry="27" fill="#667b89" opacity=".5"/>
  <path d="M313 474V141q0-93 94-93h186q94 0 94 93v333Z" fill="url(#portal-edge)"/>
  <path d="M329 474V144q0-80 79-80h184q80 0 80 80v330Z" fill="#f7e4c5"/>
  <g id="portal-view" clip-path="url(#portal-opening)">${destinations[0]}</g>
  <path d="M342 466V144q0-68 68-68h180q68 0 68 68v322" fill="none" stroke="#505c79" stroke-width="4"/>
  <path d="m319 471-30 29h411l-23-29Z" fill="#c0b7ae"/><path d="M291 501h406v10H291Z" fill="#5c717e"/>
  <g id="portal-parcel" transform="translate(223 424)"><path d="m-29-2 29-14 30 14-29 17Z" fill="#f3d4a0"/><path d="M-29-2V29L1 44V13Z" fill="#c89575"/><path d="M1 13 30-2v32L1 44Z" fill="#e4b68a"/><path d="m-14-10 29 15v32M-15 6 15-8" stroke="#829f9c" stroke-width="7" fill="none"/></g>
  <g transform="translate(800 426)"><path d="M0 0v-60" stroke="#556d7c" stroke-width="5"/><path d="m-27-60 27-18 27 18-27 18Z" fill="#dae6d5"/><path d="m-16-60h30m-30 0 9-8m-9 8 9 8" fill="none" stroke="#557b7e" stroke-width="3"/></g>
  <g fill="#435f70" font-family="ui-monospace,monospace" font-size="12" letter-spacing="3"><text x="43" y="45">SOMEWHERE ELSE</text><text x="737" y="475">RETURN ADDRESS: HERE</text></g>`, 'A freestanding portal in a quiet tiled room opens onto an impossible landscape. A small parcel waits beside the doorway.') + controls(`
  <button type="button" id="portal-turn">Turn the destination dial ↻</button><button type="button" id="portal-send" ${api.state.portalGift ? 'disabled' : ''}>${api.state.portalGift ? 'Parcel delivered to the Hall' : 'Send the small parcel'}</button>
  <a class="wonder-return" href="#/hall">← Return to the Hall</a>
  <p class="wonder-caption" id="portal-note">${names[0]}. The doorway has no room behind it.</p>`)
  + `<div id="portal-discovery" hidden>${api.game('dungeon-reset', 'Dungeon Reset', 'Discover the full five-raid cleanup and repair game in a new tab.')}</div>`;
  const parcel = host.querySelector('#portal-parcel');
  if (api.state.portalGift) parcel.style.opacity = '0';
  host.querySelector('#portal-turn').addEventListener('click', () => {
    view = (view + 1) % 3;
    host.querySelector('#portal-view').innerHTML = destinations[view];
    host.querySelector('#portal-note').textContent = `${names[view]}. ${view === 2 ? 'Someone left the cleanup shift open.' : 'You can always come back.'}`;
    host.querySelector('#portal-discovery').hidden = view !== 2;
    api.announce(`The portal now shows ${names[view].toLowerCase()}.`);
  });
  host.querySelector('#portal-send').addEventListener('click', (event) => {
    api.set({ portalGift: true });
    parcel.setAttribute('transform', 'translate(500 335) scale(.32)');
    parcel.style.opacity = '.45';
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = 'Parcel delivered to the Hall';
    host.querySelector('#portal-note').innerHTML = 'The parcel took a shortcut. It is waiting in the <a href="#/hall">Hall</a>.';
    api.announce('The small parcel went through the portal and arrived in the Hall.');
  });
}

export const wonderRooms = {
  library: { title: 'The Library', kicker: '04 / A LITTLE LIGHT READING', description: 'Some books are better left open.', color: '#b999b7', render: library },
  observatory: { title: 'The Observatory', kicker: '05 / UP IS A SUGGESTION', description: 'Stay a minute. Something will come back to you.', color: '#829caf', render: observatory },
  conservatory: { title: 'Indoor Weather', kicker: '10 / THE CONSERVATORY', description: 'A small climate, entirely in your hands.', color: '#84b79d', render: conservatory },
  portal: { title: 'Somewhere Else', kicker: '12 / THE DOOR WITHOUT A ROOM', description: 'Three views. One very reliable way back.', color: '#bba0bc', render: portal }
};
