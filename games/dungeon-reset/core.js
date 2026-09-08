/* Dungeon Reset. Original game logic. No network or DOM dependencies. */
(function (root) {
  'use strict';
  const VERSION = '1.0.0';
  const REPAIR_TIMES = [95, 100, 105, 110, 115];
  const RAID_TIME = 38;
  const PARTIES = [
    { name: 'The unpaid interns', count: 3, hp: 68, quip: 'Their first quest. Your fourth coffee.' },
    { name: 'The loot enthusiasts', count: 4, hp: 80, quip: 'They brought extra inventory space.' },
    { name: 'The review committee', count: 5, hp: 94, quip: '“Atmosphere: five stars. Hygiene: pending.”' },
    { name: 'The speedrunners', count: 6, hp: 108, quip: 'They have already complained about the door.' },
    { name: 'The chosen ones', count: 7, hp: 125, quip: 'Apparently all seven are the chosen one.' },
  ];
  const SPECS = [
    { id:'goblin', name:'Grub', kind:'monster', sprite:0, home:[330,245], pos:[225,470], seconds:10, power:17, job:'Find his station', complaint:'“They stole my lunch. Again.”', solution:'Pack a fresh lunch', flavor:'A fed goblin hits harder.', color:0xa5d87a },
    { id:'skeleton', name:'Mr. Bones', kind:'monster', sprite:1, home:[555,245], pos:[715,440], seconds:11, power:21, job:'Reassemble the staff', complaint:'“That bard called me spineless.”', solution:'Offer structural support', flavor:'A little encouragement goes a long way.', color:0xeee0b8 },
    { id:'slime', name:'Pudding', kind:'monster', sprite:2, home:[780,245], pos:[470,490], seconds:12, power:15, job:'Return to the puddle', complaint:'“I am NOT a floor stain.”', solution:'Validate their feelings', flavor:'Happy slime slows heroes for extra damage.', color:0xc3a0e5 },
    { id:'spikes', name:'Spike mat', kind:'trap', sprite:4, pos:[305,380], seconds:17, power:19, job:'Reset the spikes', flavor:'Reliable damage to every passing hero.', color:0xeee0b8 },
    { id:'bolts', name:'Bolt turret', kind:'trap', sprite:5, pos:[530,380], seconds:19, power:24, job:'Reload the bolts', flavor:'Heavy damage. The union supplies the arrows.', color:0x92c9d2 },
    { id:'fire', name:'Rune furnace', kind:'trap', sprite:6, pos:[755,380], seconds:21, power:29, job:'Rekindle the rune', flavor:'Scorches the whole party, one cape at a time.', color:0xf5a96b },
    { id:'door', name:'Front door', kind:'door', sprite:8, pos:[120,320], seconds:23, job:'Mend the front door', flavor:'A sturdy door slows the party: all defenses hit up to 20% harder.', color:0xd6aa6c },
    { id:'chest', name:'Treasure chest', kind:'chest', sprite:7, pos:[905,360], seconds:19, job:'Refill the treasure', flavor:'Worth up to 150 points. Empty chests make survivors smash the door on their way out.', color:0xf3cb75 },
    { id:'mess0', name:'Suspicious goo', kind:'mess', sprite:9, pos:[385,540], seconds:9, job:'Sweep the goo', flavor:'A clean floor earns a bonus and helps monsters fight.', color:0xb794cf },
    { id:'mess1', name:'Hero litter', kind:'mess', sprite:9, pos:[655,540], seconds:9, job:'Clear the litter', flavor:'Adventuring is apparently not a leave-no-trace activity.', color:0xb794cf },
    { id:'mess2', name:'Unclaimed bits', kind:'mess', sprite:9, pos:[850,505], seconds:9, job:'Sweep the bits', flavor:'Nobody in the party is admitting these are theirs.', color:0xb794cf },
  ];
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const round = n => Math.round(n);
  class Run {
    constructor() { this.reset(); }
    reset() {
      this.phase='title'; this.wave=0; this.time=REPAIR_TIMES[0]; this.score=0;
      this.elapsed=0; this.paused=false; this.entities=[]; this.heroes=[];
      this.events=[]; this.history=[]; this.totalRepairs=0; this.totalDefeated=0;
      this.working=null; this.raidSnapshot=null; this.workBeat=0;
      this.setupRoom(true);
    }
    setupRoom(first=false) {
      this.entities=SPECS.map((s,i)=>({ ...s, x:s.pos[0], y:s.pos[1], home:s.home?.slice(),
        condition:s.kind==='monster'?0:(first && i===3 ? 0.25:0), stationed:false, morale:0,
        paid:false, completed:false, raidWear:0,
        seconds:s.seconds*(1+this.wave*0.08),
      }));
      if (!first) {
        for(const e of this.entities.filter(e=>e.kind==='monster')) {
          e.x=clamp(e.pos[0]+Math.sin(this.wave*3+e.sprite)*55,185,860);
          e.y=clamp(e.pos[1]+Math.cos(this.wave*2+e.sprite)*28,430,500);
        }
      }
    }
    start() { this.reset(); this.phase='repair'; this.emit('phase',{phase:'repair'}); }
    emit(type,data={}) { this.events.push({type,...data}); }
    drainEvents() { return this.events.splice(0); }
    entity(id) { return this.entities.find(e=>e.id===id); }
    value(e) { return e.kind==='monster' ? (e.stationed ? .65+.35*e.morale : 0) : e.condition; }
    readiness() { return round(this.entities.reduce((v,e)=>v+this.value(e),0)/this.entities.length*100); }
    moveMonster(id,x,y) {
      const e=this.entity(id);
      if(this.phase!=='repair'||this.paused||!e||e.kind!=='monster'||e.stationed) return false;
      if(Math.hypot(x-e.home[0],y-e.home[1])<=88) {
        e.x=e.home[0]; e.y=e.home[1]; e.stationed=true; e.condition=1;
        this.score+=40; this.totalRepairs++; this.emit('station',{id,points:40}); return true;
      }
      this.emit('miss',{id}); return false;
    }
    beginWork(id) {
      const e=this.entity(id);
      if(this.phase!=='repair'||this.paused||!e||this.complete(e)||(e.kind==='monster'&&!e.stationed)) return false;
      this.working=id; this.workBeat=0; return true;
    }
    stopWork() { this.working=null; }
    complete(e) { return e.kind==='monster' ? e.stationed && e.morale>=1 : e.condition>=1; }
    tick(dt) {
      if(this.paused||!['repair','raid'].includes(this.phase)||!Number.isFinite(dt)||dt<=0) return;
      dt=Math.min(dt,.25); // Never turn a background-tab stall into lost work time.
      this.elapsed+=dt; this.time=Math.max(0,this.time-dt);
      if(this.phase==='repair') {
        const e=this.entity(this.working);
        if(e) {
          const key=e.kind==='monster'?'morale':'condition';
          e[key]=clamp(e[key]+dt/e.seconds); this.workBeat+=dt;
          if(this.workBeat>.42) {this.workBeat=0;this.emit('work',{id:e.id});}
          if(e[key]>=1) {
            this.working=null; this.totalRepairs++;
            const points=e.kind==='mess'?35:60; this.score+=points;
            this.emit('repaired',{id:e.id,points});
          }
        }
        if(this.time<=0) this.startRaid();
      } else this.tickRaid(dt);
    }
    startRaid() {
      if(this.phase!=='repair'||this.paused) return false;
      this.stopWork(); this.phase='raid'; this.time=RAID_TIME;
      const byId=Object.fromEntries(this.entities.map(e=>[e.id,this.value(e)]));
      const tidy=this.entities.filter(e=>e.kind==='mess').reduce((v,e)=>v+e.condition,0)/3;
      const ready=this.readiness();
      const setupBonus=round(ready*2+byId.chest*150+tidy*90);
      this.score+=setupBonus;
      this.raidSnapshot={byId,tidy,ready,setupBonus,defeated:0,escaped:0,damage:0};
      const party=PARTIES[this.wave];
      this.heroes=Array.from({length:party.count},(_,i)=>({id:i,hp:round(party.hp*[.85,1,1.15][i%3]),maxHp:round(party.hp*[.85,1,1.15][i%3]),
        progress:-i*.07,stage:0,active:true,escaped:false,x:90,y:335,hit:0,say:'',sayTime:0}));
      this.emit('phase',{phase:'raid'}); return true;
    }
    tickRaid(dt) {
      const s=this.raidSnapshot; const v=s.byId;
      const gates=[.09,.23,.34,.45,.56,.67,.78,.87,.98];
      for(const h of this.heroes) {
        if(!h.active) continue;
        const speed=(1+(1-v.door)*.15)/(25+v.slime*1.5);
        h.progress+=dt*speed; h.hit=Math.max(0,h.hit-dt); h.sayTime=Math.max(0,h.sayTime-dt);
        const p=clamp(h.progress); h.x=90+p*870; h.y=330+Math.sin(p*Math.PI*2)*32;
        while(h.stage<gates.length&&p>=gates[h.stage]&&h.active) {
          this.resolveGate(h,h.stage++);
        }
      }
      if(this.time<=0 || this.heroes.every(h=>!h.active)) this.endRaid();
    }
    resolveGate(h,stage) {
      const s=this.raidSnapshot,v=s.byId;
      const order=['door','spikes','goblin','bolts','skeleton','fire','slime','chest','exit'];
      const id=order[stage]; let damage=0, line='';
      const fixture=this.entity(id);
      if(fixture)fixture.raidWear=clamp(fixture.raidWear+(id==='door'?.6:1)/PARTIES[this.wave].count);
      if(id==='door') {
        line=v.door>.7?'“It says PULL.”':v.door>.2?'“That hinge sounds expensive.”':'“Open-plan dungeon. Nice.”';
      } else if(id==='chest') {
        if(v.chest<.4) {line='“EMPTY?! I demand a boss fight!”';this.entity('door').raidWear=1;this.emit('tantrum',{hero:h.id});}
        else line='“Finally. A living wage.”';
      } else if(id==='exit') {
        h.active=false;h.escaped=true;s.escaped++;this.emit('escape',{hero:h.id});
      } else {
        const e=this.entity(id);
        damage=round(e.power*v[id]*(.8+.2*s.tidy)*(1+.2*v.door));
        if(id==='slime') damage=round(damage*(1+.35*v.slime));
        if(damage===0) line=e.kind==='monster'?'“Is that employee on break?”':'“A decorative safety hazard.”';
        else if(v[id]<.5) line='“Was that the whole trap?”';
        h.hp=Math.max(0,h.hp-damage);s.damage+=damage;h.hit=.3;
        this.emit('attack',{id,hero:h.id,damage});
        if(h.hp<=0) {
          h.active=false;s.defeated++;this.totalDefeated++;
          const points=150+this.wave*30;this.score+=points;
          line=['“I shall leave a review!”','“My cape is deductible!”','“This was a team-building day!”'][h.id%3];
          this.emit('defeat',{hero:h.id,points});
        }
      }
      if(line) { h.say=line;h.sayTime=3;this.emit('quip',{hero:h.id,text:line}); }
    }
    endRaid() {
      if(this.phase!=='raid')return;
      for(const h of this.heroes.filter(h=>h.active)) {h.active=false;h.escaped=true;this.raidSnapshot.escaped++;}
      this.history.push({wave:this.wave+1,...this.raidSnapshot,score:this.score});
      this.phase=this.wave===4?'results':'report';this.stopWork();
      this.emit('phase',{phase:this.phase});
    }
    nextWave() {
      if(this.phase!=='report')return false;
      this.wave++;this.phase='repair';this.time=REPAIR_TIMES[this.wave];this.heroes=[];
      const previous=this.entities;
      this.setupRoom();
      for(const e of this.entities){
        const old=previous.find(p=>p.id===e.id);
        if(e.kind==='monster'&&old.stationed&&old.raidWear===0){e.stationed=true;e.x=e.home[0];e.y=e.home[1];e.condition=1;e.morale=old.morale;}
        else if(!['monster','mess'].includes(e.kind))e.condition=clamp(old.condition*(1-old.raidWear));
      }
      this.emit('phase',{phase:'repair'});return true;
    }
    togglePause() {
      if(!['repair','raid'].includes(this.phase))return false;
      this.paused=!this.paused;this.stopWork();this.emit('pause',{paused:this.paused});return true;
    }
    summary() {return {version:VERSION,phase:this.phase,wave:this.wave+1,time:round(this.time),score:this.score,readiness:this.readiness(),paused:this.paused,defeated:this.totalDefeated,elapsed:round(this.elapsed)};}
  }
  const STORAGE_KEY='dungeon-reset-v1';
  function readSave(storage) {
    try {
      const s=JSON.parse(storage.getItem(STORAGE_KEY)||'{}');
      const scores=(Array.isArray(s.scores)?s.scores:[]).filter(x=>x&&Number.isFinite(x.score)&&x.score>=0&&typeof x.date==='string').sort((a,b)=>b.score-a.score).slice(0,5);
      return {scores,muted:s.muted===true,music:s.music!==false,reducedMotion:s.reducedMotion===true};
    } catch {return {scores:[],muted:false,music:true,reducedMotion:false};}
  }
  function writeSave(storage,save) {try {storage.setItem(STORAGE_KEY,JSON.stringify(save));return true;}catch{return false;}}
  root.DungeonCore={VERSION,Run,SPECS,PARTIES,REPAIR_TIMES,RAID_TIME,readSave,writeSave,STORAGE_KEY,clamp};
})(globalThis);
