/* Dungeon Reset: original rendering, interactions, interface and procedural audio. */
(function () {
  'use strict';
  const C=globalThis.DungeonCore,run=new C.Run(),$=id=>document.getElementById(id);
  let storage;try{storage=localStorage;}catch{storage={getItem(){return null;},setItem(){throw new Error('Unavailable');}};}
  let save=C.readSave(storage),selected=null,scene=null,modalKind=null,previousFocus=null;
  let toastTimer=0,lastUI=0,reportDelay=0,savedRun=false,spaceDown=false;
  const escaped=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatTime=t=>`${String(Math.floor(Math.ceil(t)/60)).padStart(2,'0')}:${String(Math.ceil(t)%60).padStart(2,'0')}`;
  const persist=()=>C.writeSave(storage,save);
  const FRAMES=[[35,30,335,325],[420,25,350,335],[790,70,315,280],[1170,25,360,335],[30,375,350,275],[440,365,335,290],[815,350,285,310],[1170,390,350,275],[40,650,305,350],[420,770,330,215],[805,660,300,340],[1170,745,340,245]];
  class Sound {
    constructor(){this.ctx=null;this.master=null;this.musicTimer=0;this.step=0;this.notesPlayed=0;}
    unlock(){try{if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume();this.volume();}catch{}}
    volume(){if(this.master){const gain=save.muted||run.paused?0:.2;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setValueAtTime(gain,this.ctx.currentTime);this.master.gain.value=gain;}}
    note(freq,duration=.14,type='triangle',gain=.3,delay=0){
      if(!this.ctx||save.muted||run.paused)return;
      const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.025);this.notesPlayed++;
    }
    effect(name){
      if(name==='work'){this.note(145+Math.random()*50,.055,'triangle',.25);this.note(930,.035,'sine',.04);}
      if(name==='complete'){[392,494,587].forEach((n,i)=>this.note(n,.18,'triangle',.25,i*.075));}
      if(name==='drop'){this.note(160,.15,'triangle',.45);this.note(320,.13,'sine',.2,.08);}
      if(name==='attack'){this.note(95,.14,'sawtooth',.12);this.note(220,.1,'triangle',.16);}
      if(name==='raid'){[196,196,294,392].forEach((n,i)=>this.note(n,.3,'triangle',.4,i*.17));}
      if(name==='tick')this.note(740,.075,'sine',.15);
    }
    update(dt){
      if(!this.ctx||save.muted||!save.music||run.paused||modalKind==='manual')return;
      this.musicTimer-=dt;if(this.musicTimer>0)return;this.musicTimer=run.phase==='raid'?.32:.48;
      const melody=[62,0,69,65,0,62,57,0,60,0,67,64,0,60,57,0,58,0,65,62,0,58,53,0,57,0,64,61,0,57,52,0];
      const m=melody[this.step%32];if(m)this.note(440*2**((m-69)/12),.35,'sine',.10);
      if(this.step%8===0)this.note(440*2**((melody[this.step%32]-24-69)/12),1.5,'triangle',.07);this.step++;
    }
  }
  const audio=new Sound();
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');toastTimer=3.3;}
  function status(e){if(e.kind==='monster')return !e.stationed?'RETURN':e.morale>=1?'HAPPY ✓':`MORALE ${Math.round(e.morale*100)}%`;if(e.condition>=1)return e.kind==='mess'?'CLEAN ✓':'READY ✓';return `${Math.round(e.condition*100)}%`;}
  function select(id){selected=id;renderUI(true);scene?.targetCaretaker(run.entity(id));}
  function actionDown(){audio.unlock();if(modalKind||run.paused)return;const e=run.entity(selected);if(!e)return;if(e.kind==='monster'&&!e.stationed){run.moveMonster(e.id,...e.home);processEvents();renderUI(true);return;}run.beginWork(e.id);}
  function actionUp(){run.stopWork();spaceDown=false;}
  function startRun(){closeModal();audio.unlock();run.start();savedRun=false;selected=null;reportDelay=0;scene?.rebuild();processEvents();renderUI(true);toast('First job: drag each monster onto its matching station.');}
  function renderUI(force=false){
    if(!force&&performance.now()-lastUI<90)return;lastUI=performance.now();
    const title=run.phase==='title',repair=run.phase==='repair',raid=run.phase==='raid';
    $('title-screen').hidden=!title;$('clipboard-intro').hidden=!title;$('active-clipboard').hidden=title;
    $('pause').disabled=!repair&&!raid;$('wave').innerHTML=`${String(run.wave+1).padStart(2,'0')} <em>/ 05</em>`;
    $('score').textContent=String(run.score).padStart(5,'0');$('timer').textContent=formatTime(run.time);$('timer').classList.toggle('urgent',repair&&run.time<20);
    $('best-score').textContent=save.scores.length?save.scores[0].score.toLocaleString():'—';
    $('sound').textContent=save.muted?'SOUND OFF':'SOUND ON';$('sound').setAttribute('aria-label',save.muted?'Unmute all audio':'Mute all audio');
    $('timer-label').textContent=raid?'RAID ENDS':title?'NEXT PARTY':'DOORS OPEN IN';
    $('phase-tag').textContent=title?'EST. 1347 · STILL UNDERSTAFFED':raid?'HEROES ON THE PREMISES':run.phase==='results'?'SHIFT COMPLETE':`REPAIR PHASE ${String(run.wave+1).padStart(2,'0')} · ON THE CLOCK`;
    $('phase-title').textContent=title?'Another day. Another dungeon.':raid?C.PARTIES[run.wave].name:run.phase==='results'?'You survived the night shift.':'Let’s make this look intentional.';
    $('room-status').textContent=title?'Caretaker wanted. Experience inevitable.':raid?'Stand back. Your work is being tested.':run.paused?'Break in progress.':`NEXT: ${C.PARTIES[run.wave].name.toUpperCase()}`;
    $('room-tip').textContent=raid?'WATCH WHAT YOUR REPAIRS DO. EVERY LITTLE BIT COUNTS.':selected?run.entity(selected).flavor:'DRAG MONSTERS TO THEIR RINGS · HOLD OBJECTS TO FIX THEM';
    $('readiness').textContent=`${run.readiness()}%`;$('readiness-bar').style.width=`${run.readiness()}%`;
    $('party-note').textContent=`${C.PARTIES[run.wave].count} heroes · ${C.PARTIES[run.wave].hp} base health. ${C.PARTIES[run.wave].quip}`;
    if(!title){
      if($('task-list').children.length!==run.entities.length){$('task-list').innerHTML=run.entities.map(e=>`<button class="task" data-task="${e.id}" aria-label="Select ${escaped(e.name)}"><span>${e.kind==='monster'?'◇':e.kind==='mess'?'·':'▱'} ${e.name}</span><span class="task-status"></span></button>`).join('');$('task-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>select(b.dataset.task)));}
      for(const e of run.entities){const el=$('task-list').querySelector(`[data-task="${e.id}"]`);el.classList.toggle('selected',selected===e.id);el.classList.toggle('done',run.complete(e));el.querySelector('.task-status').textContent=status(e);el.disabled=!repair;el.setAttribute('aria-pressed',String(selected===e.id));}
    }
    const e=run.entity(selected);$('inspect-type').textContent=e?(e.kind==='monster'?'STAFF WELFARE':e.kind==='mess'?'HYGIENE':'DUNGEON MAINTENANCE'):'SELECT A JOB';$('inspect-name').textContent=e?e.name:raid?'Performance review.':'One mess at a time.';
    $('inspect-description').textContent=e?(e.kind==='monster'?(!e.stationed?`Drag ${e.name} onto the matching ring above, or use Return below.`:e.morale<1?`${e.complaint} ${e.solution}.`:'Complaint resolved. Ready to ruin someone’s quest.'):e.flavor):raid?'The heroes will test every defense along the way.':'Select a job. Hold to work. You can stop and return later.';
    $('work-progress').style.width=e?`${(e.kind==='monster'?e.morale:e.condition)*100}%`:'0%';
    const done=e&&run.complete(e),returning=e&&e.kind==='monster'&&!e.stationed;$('work-button').disabled=!repair||!e||done||run.paused;
    $('work-button').innerHTML=done?'JOB DONE ✓':returning?'RETURN TO STATION <kbd>SPACE</kbd>':e?.kind==='monster'?'HOLD TO REASSURE <kbd>SPACE</kbd>':e?.kind==='mess'?'HOLD TO SWEEP <kbd>SPACE</kbd>':e?.kind==='chest'?'HOLD TO REFILL <kbd>SPACE</kbd>':'HOLD TO REPAIR <kbd>SPACE</kbd>';
    $('open-doors').disabled=!repair||run.paused;document.body.classList.toggle('reduced-motion',save.reducedMotion);
  }
  function openModal(kind,html){actionUp();previousFocus=document.activeElement;modalKind=kind;$('modal').innerHTML=html;$('modal-layer').hidden=false;$('modal').querySelector('button')?.focus();}
  function closeModal(){modalKind=null;$('modal-layer').hidden=true;previousFocus?.focus?.();}
  function showManual(first=false){
    if(['repair','raid'].includes(run.phase)&&!run.paused)run.togglePause();audio.volume();
    openModal('manual',`<span class="eyebrow">EMPLOYEE INDUCTION · PLEASE RETAIN YOUR LIMBS</span><h2 id="modal-title">Welcome to the<br>aftermath.</h2><div class="manual-row"><b class="number">1</b><div><h3>Return the staff.</h3><p>Drag Grub, Mr. Bones, and Pudding onto their matching rings. Hold a stationed monster to resolve its complaint and improve its damage.</p></div></div><div class="manual-row"><b class="number">2</b><div><h3>Hold to put things right.</h3><p>Hold traps, the door, chest, or messes to restore them. Progress stays when you let go. The clipboard offers the same actions: select a job, then hold <b>Space</b> or its gold button.</p></div></div><div class="manual-row"><b class="number">3</b><div><h3>Let the heroes find out.</h3><p>The timer opens the doors. Repairs deal damage, a sound door boosts every defense, and a clean floor helps the monsters. An empty chest makes surviving heroes angry. Five raids, one shift.</p></div></div><p><b>Scoring:</b> return staff +40; finish jobs +60 (cleaning +35); readiness up to +200; treasure +150; clean floor +90; each defeated hero +150–270. There is no penalty for an imperfect shift.</p><p class="muted">Esc / P: pause · M: mute · Touch: drag or hold.<br>Landscape or a larger screen is easiest. No precise clicking required.</p><button class="primary" id="manual-done">${first?'GOT IT. CLOCK IN':'BACK TO IT'} <span>→</span></button>`);
    $('manual-done').onclick=()=>{closeModal();if(first)startRun();else if(run.paused)run.togglePause();audio.volume();};
  }
  function showPause(){
    if(!['repair','raid'].includes(run.phase))return;if(!run.paused)run.togglePause();audio.volume();
    openModal('pause',`<span class="eyebrow">AUTHORIZED TEA BREAK</span><h2 id="modal-title">The mess can wait.</h2><p>Your timer is stopped. Even heroes need to queue.</p><button class="primary" id="resume">RESUME SHIFT <span>→</span></button><button class="setting" id="mute-setting">All audio <strong>${save.muted?'OFF':'ON'}</strong></button><button class="setting" id="music-setting">Dungeon music <strong>${save.music?'ON':'OFF'}</strong></button><button class="setting" id="motion-setting">Reduced motion <strong>${save.reducedMotion?'ON':'OFF'}</strong></button><button class="secondary" id="pause-manual">Read the field manual</button><button class="secondary" id="restart">Restart this shift</button><button class="secondary" id="quit">Return to title</button>`);
    $('resume').onclick=()=>{closeModal();if(run.paused)run.togglePause();audio.volume();};$('mute-setting').onclick=()=>{save.muted=!save.muted;persist();audio.volume();showPause();renderUI(true);};$('music-setting').onclick=()=>{save.music=!save.music;persist();showPause();};$('motion-setting').onclick=()=>{save.reducedMotion=!save.reducedMotion;persist();showPause();renderUI(true);};$('pause-manual').onclick=()=>showManual();$('restart').onclick=()=>confirmReset(false);$('quit').onclick=()=>confirmReset(true);
  }
  function confirmReset(quit){
    openModal('confirm',`<span class="eyebrow">UNFINISHED BUSINESS</span><h2 id="modal-title">${quit?'Leave this shift?':'Start the shift over?'}</h2><p>This run’s score will be lost. Your completed high scores stay safe.</p><button class="primary" id="confirm-reset">${quit?'RETURN TO TITLE':'RESTART SHIFT'}</button><button class="secondary" id="cancel-reset">Keep my shift</button>`);
    $('confirm-reset').onclick=()=>{if(quit){closeModal();run.reset();selected=null;scene?.rebuild();audio.volume();renderUI(true);}else startRun();};$('cancel-reset').onclick=showPause;
  }
  function showCredits(){
    openModal('credits',`<span class="eyebrow">DEPARTMENT OF AFTERMATH</span><h2 id="modal-title">Dungeon Reset</h2><p><b>Created and owned by Ernest Turner.</b><br>Game concept and creative direction: Ernest Turner.<br>Design, programming, original artwork direction, and testing: Codex in collaboration with Ernest.</p><p>Original dungeon and character artwork generated with OpenAI ImageGen for this game. Original procedural score “After Hours in D Minor” and sound effects synthesized in Web Audio. No stock music or borrowed characters.</p><p>Phaser 3.90.0 by Phaser Studio Inc., MIT licensed. See the bundled credits and license files for full provenance.</p><p class="muted">Build ${C.VERSION} · Browser edition · September 2026<br>Local high scores only. No accounts, analytics, or online services.</p><button class="primary" id="credits-done">BACK TO THE DUNGEON <span>→</span></button>`);$('credits-done').onclick=closeModal;
  }
  function showReport(){
    const s=run.raidSnapshot;reportDelay=9;
    openModal('report',`<span class="eyebrow">RAID ${run.wave+1} / 5 · DAMAGE ASSESSMENT</span><h2 id="modal-title">${s.defeated===C.PARTIES[run.wave].count?'An excellent inconvenience.':s.defeated?'Mostly up to code.':'They made themselves at home.'}</h2><p>${s.defeated?'The party has filed a formal complaint. Management considers this a success.':'The heroes walked out smiling. We can do something about that next time.'}</p><div class="report-grid"><div><span>HEROES SENT PACKING</span><strong>${s.defeated} / ${C.PARTIES[run.wave].count}</strong></div><div><span>PREPARATION BONUS</span><strong>+${s.setupBonus}</strong></div></div><p>${s.ready<65?'Tip: return all three monsters first. Even without a morale boost they can fight.':s.byId.door<.6?'Tip: repairing the door boosts every trap and monster by up to 20%.':'A tidy floor and a sturdy door multiply the value of your other repairs.'}</p><button class="primary" id="next-shift">BACK TO THE MESS <span>→</span></button><p class="muted" id="report-countdown">Next repair phase in 9 seconds.</p>`);$('next-shift').onclick=nextWave;
  }
  function nextWave(){if(run.phase!=='report')return;closeModal();run.nextWave();selected=null;scene?.rebuild();processEvents();renderUI(true);}
  function showResults(){
    let saved=true;if(!savedRun){save.scores.push({score:run.score,date:new Date().toISOString(),defeated:run.totalDefeated});save.scores.sort((a,b)=>b.score-a.score);save.scores=save.scores.slice(0,5);saved=persist();savedRun=true;}
    const rank=run.score>=7200?'Employee of the underworld':run.score>=5000?'Senior mess manager':run.score>=2800?'Dependable dungeon goblin':'Promising probationary caretaker';
    openModal('results',`<span class="eyebrow">SHIFT COMPLETE · YOU MAY NOW SIT DOWN</span><h2 id="modal-title">${rank}.</h2><p>Five parties. One room. Somehow, still employed.</p><div class="report-grid"><div><span>FINAL SHIFT SCORE</span><strong>${run.score.toLocaleString()}</strong></div><div><span>HEROES DEFEATED</span><strong>${run.totalDefeated} / 25</strong></div></div><table class="ledger"><thead><tr><th>RAID</th><th>READINESS</th><th>DEFEATED</th></tr></thead><tbody>${run.history.map(h=>`<tr><td>${h.wave}. ${C.PARTIES[h.wave-1].name}</td><td>${h.ready}%</td><td>${h.defeated} / ${C.PARTIES[h.wave-1].count}</td></tr>`).join('')}</tbody></table><p>${saved?`Personal best: <b>${save.scores[0].score.toLocaleString()}</b> · Saved on this browser.`:'<span class="save-warning">Browser storage is unavailable. This score could not be saved.</span>'}</p><details><summary>Local high scores</summary><table class="ledger"><tbody>${save.scores.map((s,i)=>`<tr><td>${i+1}. ${escaped(s.date.slice(0,10))}</td><td>${s.score.toLocaleString()}</td></tr>`).join('')}</tbody></table></details><button class="primary" id="again">ONE MORE SHIFT <span>→</span></button><button class="secondary" id="results-title">Clock out to title</button>`);
    $('again').onclick=startRun;$('results-title').onclick=()=>{closeModal();run.reset();selected=null;scene?.rebuild();renderUI(true);};
  }
  function processEvents(){
    for(const event of run.drainEvents()){
      const e=run.entity(event.id);
      if(event.type==='station'){audio.effect('drop');scene?.burst(e.x,e.y,e.color);scene?.float(e.x,e.y-50,'+40 · BACK ON DUTY','#c5e8a9');toast(`${e.name}: ${e.complaint}`);}
      if(event.type==='miss')toast('Close! Drop onto that monster’s matching ring.');
      if(event.type==='work'){audio.effect('work');scene?.workSpark(e);}
      if(event.type==='repaired'){audio.effect('complete');scene?.burst(e.x,e.y,e.color);scene?.float(e.x,e.y-50,`+${event.points} · ${e.kind==='monster'?'FEELINGS VALIDATED':'JOB DONE'}`,'#e9d18c');}
      if(event.type==='attack'){if(event.damage){audio.effect('attack');scene?.attack(e,run.heroes[event.hero],event.damage);}else scene?.float(e.x,e.y-35,'OFF DUTY','#a7adb0');}
      if(event.type==='defeat'){audio.effect('complete');const h=run.heroes[event.hero];scene?.float(h.x,h.y-55,`+${event.points} · RETREAT!`,'#f3d892');}
      if(event.type==='quip')scene?.speech(event.text,event.hero);
      if(event.type==='tantrum'){scene?.float(120,245,'DOOR SMASHED!','#ffad91');scene?.burst(120,320,0xd6aa6c);}
      if(event.type==='phase'){
        if(event.phase==='raid'){audio.effect('raid');scene?.spawnHeroes();toast('Doors open. Let’s see what holds.');}
        if(event.phase==='repair'){$('task-list').innerHTML='';audio.volume();}
        if(event.phase==='report')showReport();if(event.phase==='results'){audio.effect('complete');showResults();}renderUI(true);
      }
    }
  }
  class DungeonScene extends Phaser.Scene {
    constructor(){super('Dungeon');this.objects=new Map();this.heroObjects=[];this.dragId=null;}
    preload(){this.load.image('dungeon','assets/dungeon.png');this.load.image('atlas','assets/sprites.png');}
    create(){
      scene=this;FRAMES.forEach((f,i)=>this.textures.get('atlas').add(`sprite${i}`,0,...f));
      this.add.image(500,325,'dungeon').setDisplaySize(1000,650);this.add.rectangle(500,325,1000,650,0x071419,.16);
      this.path=this.add.graphics();this.path.lineStyle(2,0xdacb9e,.15);for(let x=120;x<930;x+=23)this.path.lineBetween(x,335+Math.sin((x-90)/870*Math.PI*2)*32,x+8,335+Math.sin((x-90)/870*Math.PI*2)*32);
      this.add.text(65,205,'ENTRY',{fontFamily:'Arial',fontSize:'12px',color:'#a9b9ab',letterSpacing:2}).setAngle(-90).setAlpha(.65);
      this.add.text(870,430,'LOOT',{fontFamily:'Arial',fontSize:'12px',color:'#c3b584',letterSpacing:2}).setAlpha(.65);
      this.floor=this.add.graphics();this.bars=this.add.graphics().setDepth(60);
      this.stationLabels=C.SPECS.filter(e=>e.home).map(e=>this.add.text(e.home[0],e.home[1]-43,`${e.name.toUpperCase()}'S STATION`,{fontFamily:'Arial',fontSize:'13px',color:'#cddbc5',backgroundColor:'#15262abb',padding:{x:7,y:4}}).setOrigin(.5).setDepth(10));
      this.caretaker=this.add.image(645,490,'atlas','sprite10').setDisplaySize(155,170).setDepth(15);this.caretakerTarget={x:645,y:490};
      this.speechLabel=this.add.text(500,117,'',{fontFamily:'Georgia',fontSize:'19px',color:'#f4e4b8',align:'center',backgroundColor:'#132426ed',padding:{x:18,y:10},wordWrap:{width:660}}).setOrigin(.5).setDepth(95).setVisible(false);this.speechTimer=0;this.rebuild();
      this.input.on('pointerup',actionUp);this.input.on('pointerupoutside',actionUp);
      this.input.on('dragstart',(pointer,obj)=>{const e=run.entity(obj.getData('id'));if(!e||e.stationed||run.phase!=='repair'||run.paused||modalKind)return;this.dragId=e.id;obj.setDepth(100);audio.unlock();select(e.id);});
      this.input.on('drag',(pointer,obj,x,y)=>{if(this.dragId!==obj.getData('id'))return;obj.setPosition(C.clamp(x,60,950),C.clamp(y,135,590));});
      this.input.on('dragend',(pointer,obj)=>{const e=run.entity(this.dragId);if(!e)return;run.moveMonster(e.id,obj.x,obj.y);obj.setPosition(e.x,e.y).setDepth(20);this.dragId=null;processEvents();renderUI(true);});
      $('start').disabled=false;renderUI(true);
    }
    rebuild(){
      if(!this.floor)return;for(const o of this.objects.values()){o.sprite.destroy();o.label.destroy();o.badge.destroy();}this.objects.clear();this.heroObjects.forEach(o=>o.destroy());this.heroObjects=[];this.speechLabel.setVisible(false);this.speechTimer=0;this.dragId=null;
      for(const e of run.entities){const dims=e.kind==='monster'?[98,106]:e.kind==='door'?[108,130]:e.kind==='mess'?[90,59]:[100,98];
        const sprite=this.add.image(e.x,e.y,'atlas',`sprite${e.sprite}`).setDisplaySize(...dims).setDepth(20).setInteractive({useHandCursor:true});sprite.setData('id',e.id);if(e.kind==='monster')this.input.setDraggable(sprite);
        sprite.on('pointerdown',()=>{if(run.phase!=='repair'||run.paused||modalKind)return;audio.unlock();select(e.id);if(e.kind!=='monster'||e.stationed)run.beginWork(e.id);});
        const label=this.add.text(e.x,e.y+59,e.name.toUpperCase(),{fontFamily:'Arial',fontSize:'12px',color:'#d0d5c5',backgroundColor:'#132426cc',padding:{x:7,y:4}}).setOrigin(.5).setDepth(65);
        const badge=this.add.text(e.x,e.y+78,'',{fontFamily:'Arial',fontSize:'10px',color:'#e1c98d'}).setOrigin(.5).setDepth(65);this.objects.set(e.id,{sprite,label,badge,dims});
      }
    }
    targetCaretaker(e){if(e)this.caretakerTarget={x:C.clamp(e.x-74,165,880),y:C.clamp(e.y+50,310,560)};}
    spawnHeroes(){this.heroObjects.forEach(o=>o.destroy());this.heroObjects=run.heroes.map(h=>this.add.image(h.x,h.y,'atlas','sprite3').setDisplaySize(66+(h.id%3)*6,72+(h.id%3)*6).setDepth(45));}
    float(x,y,text,color){const t=this.add.text(x,y,text,{fontFamily:'Arial',fontSize:'13px',fontStyle:'bold',color,stroke:'#142324',strokeThickness:4}).setOrigin(.5).setDepth(120);this.tweens.add({targets:t,y:y-(save.reducedMotion?0:35),alpha:0,duration:1500,onComplete:()=>t.destroy()});}
    burst(x,y,color){if(save.reducedMotion)return;for(let i=0;i<9;i++){const p=this.add.rectangle(x,y,4,4,color).setDepth(110);this.tweens.add({targets:p,x:x+Math.cos(i*2.4)*60,y:y+Math.sin(i*2.4)*45,alpha:0,angle:120,duration:550,onComplete:()=>p.destroy()});}}
    workSpark(e){if(save.reducedMotion||!e)return;const p=this.add.rectangle(e.x+(Math.random()-.5)*35,e.y-15,4,8,0xf4ce78).setDepth(90);this.tweens.add({targets:p,y:p.y-22,x:p.x+15,alpha:0,angle:80,duration:350,onComplete:()=>p.destroy()});}
    attack(e,h,damage){if(!e||!h)return;this.float(h.x,h.y-33,`−${damage}`,'#ffb59e');const effect=this.add.graphics().setDepth(48);effect.lineStyle(e.id==='fire'?10:3,e.color,.8);effect.lineBetween(e.x,e.y-15,h.x,h.y);this.tweens.add({targets:effect,alpha:0,duration:save.reducedMotion?80:230,onComplete:()=>effect.destroy()});if(!save.reducedMotion){const sprite=this.objects.get(e.id).sprite;this.tweens.add({targets:sprite,angle:e.kind==='monster'?-10:5,duration:90,yoyo:true});}}
    speech(text){if(this.speechTimer>1.1)return;this.speechLabel.setText(text).setVisible(true);this.speechTimer=3.3;}
    update(time,delta){
      const dt=Math.min(delta/1000,.1);if(!modalKind||modalKind==='report'||modalKind==='results')run.tick(dt);
      if(modalKind==='report'){reportDelay-=dt;$('report-countdown').textContent=`Next repair phase in ${Math.ceil(reportDelay)} seconds.`;if(reportDelay<=0)nextWave();}
      audio.update(dt);processEvents();renderUI();if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');}
      if(run.paused){this.tweens.pauseAll();return;}this.tweens.resumeAll();if(this.speechTimer>0){this.speechTimer-=dt;if(this.speechTimer<=0)this.speechLabel.setVisible(false);}
      const title=run.phase==='title',repair=run.phase==='repair';this.caretaker.setVisible(run.phase!=='raid');this.stationLabels.forEach(l=>l.setVisible(repair));
      if(title)this.caretaker.setPosition(755,420).setDisplaySize(240,265).setDepth(50);
      else{this.caretaker.setDisplaySize(65,74).setDepth(25);const t=this.caretakerTarget;this.caretaker.x+=(t.x-this.caretaker.x)*Math.min(1,dt*8);this.caretaker.y+=(t.y-this.caretaker.y)*Math.min(1,dt*8);this.caretaker.setAngle(run.working&&!save.reducedMotion?Math.sin(time*.02)*6:0);}
      this.floor.clear();this.bars.clear();
      for(const e of run.entities){const o=this.objects.get(e.id);if(!o)continue;const dragging=this.dragId===e.id;
        if(!dragging){o.sprite.setPosition(e.x,e.y);if(e.kind==='monster'&&!e.stationed)o.sprite.setAngle(title?-13:15*Math.sin(e.sprite+1));else if(!this.tweens.isTweening(o.sprite))o.sprite.setAngle(0);}
        if(e.home){this.floor.lineStyle(dragging?4:2,e.color,dragging?.95:.45);this.floor.strokeEllipse(...e.home,126,60);this.floor.fillStyle(e.color,e.stationed?.08:.025);this.floor.fillEllipse(...e.home,122,56);if(!e.stationed&&!title){this.floor.lineStyle(2,e.color,.2);this.floor.lineBetween(e.home[0]-7,e.home[1],e.home[0]+7,e.home[1]);this.floor.lineBetween(e.home[0],e.home[1]-7,e.home[0],e.home[1]+7);}}
        const value=run.value(e),wear=repair||title?0:e.raidWear,alpha=e.kind==='mess'?1-e.condition*.95:.6+value*.4-wear*.22;o.sprite.setAlpha(title?.85:alpha);
        if(wear>.6&&e.kind==='monster'){o.sprite.setAngle(60);o.sprite.y+=24;}
        if(e.kind==='door'&&wear>.5){this.bars.lineStyle(3,0x30281e,1);this.bars.beginPath();this.bars.moveTo(e.x-15,e.y-35);this.bars.lineTo(e.x+8,e.y-7);this.bars.lineTo(e.x-3,e.y+5);this.bars.lineTo(e.x+14,e.y+25);this.bars.strokePath();}
        if(e.kind==='monster'&&e.stationed&&!save.reducedMotion&&!dragging&&!run.working)o.sprite.y+=Math.sin(time*.002+e.sprite)*2;
        o.label.setPosition(o.sprite.x,o.sprite.y+(e.kind==='mess'?37:60)).setVisible(!title&&!(e.kind==='mess'&&e.condition>=1));o.badge.setPosition(o.label.x,o.label.y+21).setText(e.kind==='monster'&&!e.stationed?'DRAG TO MATCHING RING':status(e)).setVisible(repair&&!title&&!(e.kind==='mess'&&e.condition>=1));
        if(selected===e.id&&repair){this.floor.lineStyle(2,0xf6d58a,.85);this.floor.strokeRoundedRect(o.sprite.x-61,o.sprite.y-59,122,118,12);}
        if(!title&&e.kind!=='mess'){const x=o.sprite.x-35,y=o.sprite.y+46;this.bars.fillStyle(0x0c1d22,.9);this.bars.fillRoundedRect(x,y,70,4,2);this.bars.fillStyle(value>=1?0xb8dca3:0xe6bf71,1);this.bars.fillRoundedRect(x,y,70*value,4,2);}
      }
      if(['raid','report','results'].includes(run.phase))run.heroes.forEach((h,i)=>{const o=this.heroObjects[i];if(!o)return;o.setPosition(h.x,h.y+(save.reducedMotion?0:Math.sin(time*.01+i)*3));o.setVisible(h.progress>=0&&!h.escaped);o.setAlpha(h.hp<=0?.3:1);o.setAngle(h.hp<=0?75:0);if(h.hit>0)o.setTint(0xffbb99);else o.clearTint();if(h.active&&h.progress>=0){this.bars.fillStyle(0x172327,1);this.bars.fillRect(h.x-26,h.y-45,52,5);this.bars.fillStyle(0xefb38a,1);this.bars.fillRect(h.x-26,h.y-45,52*C.clamp(h.hp/h.maxHp),5);}});
    }
  }
  $('start').disabled=true;
  const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1000,height:650,backgroundColor:'#17292c',antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2},audio:{noAudio:true},scene:DungeonScene,render:{powerPreference:'low-power'},fps:{target:60}});
  $('start').onclick=()=>{audio.unlock();showManual(true);};$('how-to').onclick=()=>showManual(false);$('help-footer').onclick=()=>showManual(false);$('credits').onclick=showCredits;$('pause').onclick=showPause;
  $('brand').onclick=e=>{e.preventDefault();if(['repair','raid'].includes(run.phase))showPause();};$('sound').onclick=()=>{audio.unlock();save.muted=!save.muted;persist();audio.volume();renderUI(true);};$('open-doors').onclick=()=>{audio.unlock();run.startRaid();processEvents();renderUI(true);};
  $('work-button').addEventListener('pointerdown',e=>{e.preventDefault();$('work-button').setPointerCapture(e.pointerId);actionDown();});$('work-button').addEventListener('pointerup',actionUp);$('work-button').addEventListener('pointercancel',actionUp);
  $('work-button').addEventListener('keydown',e=>{if(e.code==='Enter'&&!e.repeat){e.preventDefault();actionDown();}});$('work-button').addEventListener('keyup',e=>{if(e.code==='Enter')actionUp();});window.addEventListener('pointerup',actionUp);window.addEventListener('pointercancel',actionUp);
  document.addEventListener('keydown',e=>{
    if(e.code==='Tab'&&modalKind){const f=Array.from($('modal').querySelectorAll('button,summary,[tabindex="0"]')).filter(x=>!x.disabled);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0]?.focus();}}
    if(e.code==='KeyM'&&!e.repeat){$('sound').click();return;}
    if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){e.preventDefault();if(modalKind==='pause')$('resume').click();else if(modalKind==='manual')$('manual-done').click();else if(modalKind==='credits')closeModal();else if(!modalKind)showPause();}
    if(e.code==='Space'&&!modalKind&&run.phase==='repair'){e.preventDefault();if(!spaceDown){spaceDown=true;actionDown();}}
  });
  document.addEventListener('keyup',e=>{if(e.code==='Space')actionUp();});window.addEventListener('blur',()=>{actionUp();if(['repair','raid'].includes(run.phase)&&!modalKind)showPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){actionUp();if(['repair','raid'].includes(run.phase)&&!modalKind)showPause();}});
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser view.');}};
  const inspect=()=>({...run.summary(),entities:run.entities.map(e=>({id:e.id,x:e.x,y:e.y,home:e.home,kind:e.kind,condition:e.condition,stationed:e.stationed,morale:e.morale})),history:run.history,settings:{...save},selected,audio:{state:audio.ctx?.state??'not-started',notesPlayed:audio.notesPlayed,gain:audio.master?.gain.value??0}});
  window.dungeonReset={inspect};
  if(new URLSearchParams(location.search).has('qa'))window.dungeonReset.qa={run,game,step(seconds){for(let t=0;t<seconds;t+=.1){run.tick(Math.min(.1,seconds-t));processEvents();}renderUI(true);},start:startRun,scene:()=>scene};
  if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'inspect_dungeon_shift',description:'Read the current Dungeon Reset score, phase, timer, and repair state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||Object.keys(input).length)throw new Error('Expected an empty object.');return inspect();}},{signal:lifecycle.signal})).catch(()=>{});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}catch{}}
  renderUI(true);
})();
