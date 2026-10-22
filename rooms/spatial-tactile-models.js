// Authored, bounded room geometry. Controllers supply only the small viewState
// below; the existing games, their controllers, and their saves are independent.
const clamp = (value, lo, hi, fallback = 0) => Number.isFinite(Number(value)) ? Math.min(hi, Math.max(lo, Number(value))) : fallback;
const P = { wood:'#876348', edge:'#604a38', brass:'#b99762', cream:'#e2d5ae', dark:'#354747', metal:'#768c88', paper:'#e8ddc4' };

function builder(){
  const objects=[];
  const add=(type,position,size,color,rotation,extra={})=>{const o={type,position,size,color,...extra};if(rotation)o.rotation=rotation;objects.push(o);return o;};
  return {objects,
    box:(p,s,c,r,e)=>add('box',p,s,c,r,e),
    cylinder:(p,s,c,r,e)=>add('cylinder',p,s,c,r,e),
    sphere:(p,s,c,r,e)=>add('sphere',p,s,c,r,e),
    beam:(a,c,r,color,extra={})=>{const d=c.map((v,i)=>v-a[i]),length=Math.hypot(...d),mid=a.map((v,i)=>(v+c[i])/2);return add('cylinder',mid,[r,length,r],color,[Math.atan2(d[2],d[1]),0,-Math.atan2(d[0],Math.hypot(d[1],d[2]))],extra);}
  };
}
const wood={material:'wood'},metal={material:'metal'},paper={material:'paper'};

function shell(b,{wall='#aaa89a',side='#828f86',floor='#82796a',floorMaterial='wood',rug='#71665c'}={}){
  b.box([0,-.15,0],[11,.3,12],floor,null,{material:floorMaterial});
  for(const x of[-3.7,-1.85,0,1.85,3.7])b.box([x,.008,0],[.025,.012,12],'#5d6055');
  b.box([0,2.95,-5.95],[11,5.9,.22],wall,null,{material:'plaster'});
  b.box([5.45,2.95,0],[.22,5.9,12],wall,null,{material:'plaster'});
  // A real left-wall aperture. Glazing and warm practical lamps remain separate.
  b.box([-5.45,2.95,-4.75],[.22,5.9,2.5],side,null,{material:'plaster'});
  b.box([-5.45,2.95,3.1],[.22,5.9,5.8],side,null,{material:'plaster'});
  b.box([-5.45,.75,-1.35],[.22,1.5,4.3],side,null,{material:'plaster'});
  b.box([-5.45,5.3,-1.35],[.22,1.2,4.3],side,null,{material:'plaster'});
  b.box([-5.52,3.1,-1.35],[.04,3.2,4.1],'#c3d1cc',null,{material:'glass',opacity:.19,castShadow:false});
  for(const z of[-3.45,-1.35,.75])b.box([-5.27,3.1,z],[.2,3.4,.12],P.dark,null,wood);
  b.box([-5.25,3.1,-1.35],[.25,.12,4.3],P.dark,null,wood);
  b.box([-5.18,1.48,-1.35],[.54,.15,4.4],P.edge,null,wood);
  for(const z of[-5.75,1.75,5.7])b.box([0,5.75,z],[10.8,.22,.22],P.edge,null,wood);
  b.box([0,.07,-5.79],[10.8,.14,.13],P.edge,null,wood);
  b.box([5.29,.07,0],[.13,.14,11.8],P.edge,null,wood);
  // A worn rug anchors the visitor side rather than filling the room with props.
  b.box([.2,.026,2.75],[6.4,.025,3.2],rug,null,{material:'paper'});
  for(const z of[1.27,4.23])b.box([.2,.043,z],[6.2,.008,.065],'#b8a181');
  for(const x of[-2.86,3.26])b.box([x,.043,2.75],[.065,.008,2.9],'#b8a181');
  b.box([5.24,2.9,5.45],[.35,5.8,.36],P.edge,null,wood);
}

function cabinet(b,x,z,width=3.8,color='#536d66'){
  b.box([x,1.38,z],[width,2.7,1.03],color,null,wood);
  b.box([x,2.8,z],[width+.15,.17,1.13],P.wood,null,wood);
  const col=(width-.22)/2;
  for(const dx of[-col/2,col/2])for(let row=0;row<3;row++){
    const y=.55+row*.78;
    b.box([x+dx,y,z+.535],[col-.09,.69,.08],row===1?'#64786b':color,null,wood);
    b.box([x+dx,y+.03,z+.61],[.42,.07,.08],P.brass,null,metal);
  }
  b.box([x,3.85,z-.05],[width,.12,.8],P.edge,null,wood);
  b.box([x-width*.44,3.29,z-.05],[.1,.94,.65],P.edge,null,wood);
  b.box([x+width*.44,3.29,z-.05],[.1,.94,.65],P.edge,null,wood);
}

function table(b,{x=0,z=.25,width=8,depth=2.8,height=1.85,color=P.wood}={}){
  b.box([x,height,z],[width,.21,depth],color,null,wood);
  b.box([x,height-.25,z+depth/2-.06],[width,.31,.13],P.edge,null,wood);
  for(const dx of[-width/2+.28,width/2-.28])for(const dz of[-depth/2+.23,depth/2-.23])b.box([x+dx,(height-.1)/2,z+dz],[.2,height-.1,.2],P.dark,null,metal);
  b.box([x,.5,z-depth/2+.23],[width-.5,.14,.13],P.dark,null,metal);
}

function pendant(b,x,z,{y=4.7,color='#7b6654'}={}){
  b.cylinder([x,(5.8+y)/2+.12,z],[.025,5.8-y-.24,.025],P.dark,null,metal);
  b.cylinder([x,y+.18,z],[.22,.31,.22],color,null,metal);
  b.cylinder([x,y-.015,z],[.7,.12,.7],color,null,metal);
  b.cylinder([x,y-.085,z],[.65,.025,.65],'#ffe0a2',null,{emissive:.75,castShadow:false});
}

function notebook(b,x,y,z,rotation=0){
  b.box([x,y,z],[.82,.08,.62],P.edge,[0,rotation,0],wood);
  b.box([x,y+.045,z],[.76,.025,.58],P.paper,[0,rotation,0],paper);
  b.box([x-.14,y+.063,z],[.015,.01,.52],'#a69b7f',[0,rotation,0]);
}

function chair(b,x,z,color='#71685c',turn=-.12){
  b.cylinder([x,1.05,z],[.58,.17,.52],color,null,wood);
  b.box([x,1.72,z-.42],[.95,1.1,.12],color,[0,turn,-.04],wood);
  for(const dx of[-.36,.36])for(const dz of[-.31,.31])b.box([x+dx,.5,z+dz],[.09,.99,.09],P.dark,null,metal);
}

function scene(b,hotspots,{target=[0,2.2,-.5],eye=[.8,4.35,9.35],sun=[-.8,.75,.4],lamp=[-1.5,4.3,.6],lampColor='#ffd6a0',ambient=.58,detail,mobileDetail}={}){
  const camera={eye,target};
  return {objects:b.objects,hotspots,camera,sun,ambient,lightColor:'#ffebce',fogColor:'#a5aaa0',lights:[{position:lamp,color:lampColor,intensity:.7}],cameras:{
    center:camera,left:{eye:[2.5,4.2,9.2],target:[-1.65,2.2,-.6]},right:{eye:[-2.5,4.2,9.2],target:[1.65,2.2,-.6]},
    'mobile-center':{eye:[.35,4.8,11.2],target:[0,2.2,-.4]},'mobile-left':{eye:[2.3,4.3,9.5],target:[-2.15,2.2,-.3]},'mobile-right':{eye:[-2.3,4.3,9.5],target:[2.15,2.2,-.3]},
    detail:detail||{eye:[.6,3.6,6.2],target:[0,2.6,.3]},'mobile-detail':mobileDetail||detail||{eye:[.8,3.4,5.0],target:[0,2.6,.3]}
  }};
}

/** viewState: light 0..100, warmth 0..100, taps nonnegative integer. */
export function makeSpecimens(state={},viewState={}){
  const b=builder(),light=clamp(viewState.light,0,100,20),warmth=clamp(viewState.warmth,0,100,15),taps=Math.max(0,Math.floor(Number(viewState.taps)||0));
  shell(b,{wall:'#ada8a1',side:'#737f81',floor:'#868b83',floorMaterial:'plaster',rug:'#6b6470'});
  cabinet(b,-2.35,-5.15,3.6,'#5e7170');cabinet(b,2.05,-5.15,3.6,'#66716c');
  table(b,{width:8.1,depth:2.7,z:.35});
  const lampX=-3.3+light*.066;
  b.box([0,4.62,.22],[8.1,.13,.16],P.dark,null,metal);
  for(const x of[-3.8,3.8])b.box([x,4.96,.22],[.08,.68,.08],P.metal,null,metal);
  pendant(b,lampX,.3,{y:4.1,color:'#8e704f'});
  for(const x of[-2.6,0,2.6]){
    b.cylinder([x,1.98,.35],[1.03,.14,.93],P.brass,null,metal);
    b.cylinder([x,2.06,.35],[.92,.035,.83],'#556f65');
    b.sphere([x,2.8,.35],[.94,.83,.84],'#b7d9d1',null,{material:'glass',opacity:.12,castShadow:false});
    b.cylinder([x,3.63,.35],[.12,.08,.12],P.brass,null,metal);
    b.box([x,1.94,1.31],[.57,.13,.03],P.paper,null,paper);
  }
  // The blue specimen leans and turns toward the physically moving lamp.
  const follow=(light-50)*.006,bodyX=-2.6+follow;
  b.sphere([bodyX,2.55,.35],[.48,.4,.4],'#5e88a5',[0,0,-follow*.5]);
  b.sphere([bodyX+.12,2.82,.57],[.23,.2,.16],'#91b6bd');
  b.sphere([bodyX+.12+follow*.13,2.83,.71],[.08,.09,.035],'#e5cd88',null,{emissive:.25});
  for(const dx of[-.24,0,.24])b.beam([bodyX+dx,2.35,.45],[bodyX+dx*1.25,2.14,.58],.04,'#517a8c');
  // Warmth separates the eight folded petals into a large, visible blossom.
  const spread=.14+warmth*.0044;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;b.sphere([Math.cos(a)*spread,2.65+Math.sin(a)*spread,.38],[.17,.3,.11],i%2?'#b97870':'#d0a08c',[0,0,a-Math.PI/2]);}
  b.cylinder([0,2.62,.44],[.2,.17,.2],'#d0b276',[Math.PI/2,0,0]);
  b.beam([0,2.13,.3],[0,2.5,.32],.055,'#727d5d');
  // A tapped membrane keeps alternating lobes; its pearl changes sides.
  const odd=taps%2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4,up=(i%2===odd?1:-1)*.14;b.sphere([2.6+Math.cos(a)*.48,2.57+up,.35+Math.sin(a)*.34],[.29,.09,.23],i%2?'#80a79c':'#94b2a2');}
  b.sphere([2.6,2.61+(odd?.19:-.13),.4],[.15,.15,.15],'#e0d9b0',null,{emissive:.16});
  notebook(b,-3.4,2.005,1.05,-.12);chair(b,-4.1,3.6,'#6c6d73');
  // Useful background scale: a labelled tray and two closed research volumes.
  b.box([-2.5,2.97,-5.0],[1.3,.17,.7],'#a2987d',null,wood);
  for(const [x,h,c]of[[1.35,.36,'#957559'],[1.75,.49,'#7c8081']])b.box([x,3.04+h/2,-5.1],[.26,h,.55],c,null,paper);
  return scene(b,[
    {id:'light',label:'Move the specimen light',position:[lampX,3.96,.3],href:'#sp-light-control'},
    {id:'warmth',label:'Warm the folded specimen',position:[0,2.85,.7],href:'#sp-warmth-control'},
    {id:'tap',label:'Tap the ripple specimen',position:[2.6,2.75,.8],href:'#sp-tap'}
  ],{lamp:[lampX,3.9,.4],lampColor:warmth>60?'#ffbe88':'#ffe4ad',target:[0,2.45,-.3],
    detail:{eye:[.6,3.6,6.2],target:[0,2.7,.35]},mobileDetail:{eye:[1.1,3.3,4.5],target:[0,2.7,.35]}});
}

/** viewState: compression is the original bounded spring displacement. */
export function makeSoft(state={},viewState={}){
  const b=builder(),n=clamp(viewState.compression,-.45,1.06,0),squeeze=Math.max(0,n),top=3.24-n*.69;
  shell(b,{wall:'#b2ad98',side:'#84968a',floor:'#70877c',floorMaterial:'plaster',rug:'#a17f6b'});
  cabinet(b,2.55,-5.15,3.7,'#688575');
  // Deep drying alcove, with three meaningful material samples on a shelf.
  b.box([-2.8,3.35,-5.69],[3.4,2.7,.22],'#536f65',null,wood);
  b.box([-2.8,2.2,-5.32],[3.5,.16,.75],P.wood,null,wood);
  for(const [x,c]of[[-3.7,'#bd9080'],[-2.8,'#819aa0'],[-1.9,'#9a8d9e']])b.sphere([x,2.49,-5.26],[.27,.23,.27],c);
  table(b,{width:8.4,depth:3.1,z:.35,color:'#97775a'});
  for(const x of[-3.85,3.85])b.box([x,3.04,-.48],[.18,2.21,.18],P.dark,null,metal);
  b.box([0,4.16,-.48],[7.9,.2,.28],P.dark,null,metal);
  for(const x of[-2.55,0,2.55]){
    b.cylinder([x,(4.07+top)/2,-.1],[.045,4.07-top,.045],P.metal,null,metal);
    b.box([x,top,-.02],[1.62,.12,1.22],'#9aa99a',null,metal);
    b.cylinder([x,1.99,.18],[.94,.045,.82],'#c9be9f');
  }
  const gelHeight=1.21-n*.69;
  b.sphere([-2.55,2.02+gelHeight/2,.18],[.73*(1+n*.29),gelHeight/2,.65*(1+n*.2)],'#c4857e',null,{material:'glass',opacity:.88});
  b.sphere([-2.76,2.11+gelHeight*.66,.66],[.13,.07,.055],'#e5b7a0',null,{castShadow:false});
  // A helix built from slender segments stores the press's displacement.
  const springTop=top-.14,base=2.08,turns=3.5,segments=28;
  for(let i=0;i<segments;i++){const point=k=>{const t=k/segments,a=t*Math.PI*2*turns;return[Math.cos(a)*.49,base+t*(springTop-base),.18+Math.sin(a)*.49];};b.beam(point(i),point(i+1),.045,'#b59b67',metal);}
  b.cylinder([0,springTop+.045,.18],[.7,.12,.65],'#779aa0',null,metal);
  // The ribbon is a bent continuous strip; the press flattens its central arch.
  const arch=.95-n*.57;
  for(let i=0;i<11;i++){
    const point=k=>{const t=k/11;return[1.85+t*1.4,2.08+Math.sin(t*Math.PI)*arch,.18+Math.sin(t*Math.PI*2)*(.25+squeeze*.18)];};
    const a=point(i),c=point(i+1);b.beam(a,c,.13,'#9b899f');
  }
  pendant(b,-2.1,1.1,{y:4.95,color:'#526e63'});
  notebook(b,3.45,2.005,1.48,.19);chair(b,-4.15,3.85,'#896b59');
  b.box([2.6,3.15,-5.12],[1.18,.48,.63],'#927b65',null,wood);
  return scene(b,[
    {id:'press',label:'Lower the materials press',position:[0,4.18,-.35],href:'#sf-compress'},
    {id:'pluck',label:'Pluck the materials',position:[-2.55,2.7,.65],href:'#sf-pluck'}
  ],{lamp:[-2.1,4.7,1.1],target:[0,2.4,-.25],eye:[1.4,4.55,9.8],
    detail:{eye:[1.35,3.8,6.5],target:[0,2.7,.25]},mobileDetail:{eye:[1.1,3.4,4.6],target:[0,2.6,.18]}});
}

/** viewState: position/angle and delayedPosition/delayedAngle match the sliders. */
export function makeMirrors(state={},viewState={}){
  const b=builder(),pos=clamp(viewState.position,-100,100),angle=clamp(viewState.angle,-90,90)*Math.PI/180,
    delay=clamp(viewState.delayedPosition,-100,100,pos),delayAngle=clamp(viewState.delayedAngle,-90,90,angle*180/Math.PI)*Math.PI/180;
  shell(b,{wall:'#99929a',side:'#7e8589',floor:'#847866',rug:'#7a5b62'});
  // The three physical optical cabinets are deep enough to hold disagreeing
  // duplicates. These authored responses are not a claim of raytraced mirrors.
  const positions=[-3,0,3],colors=['#b88e7f','#c1ae78','#a39cb9'];
  for(let i=0;i<3;i++){
    const x=positions[i];
    b.box([x,2.78,-3.72],[2.58,3.9,.42],i===1?'#79644e':'#635957',null,wood);
    b.box([x,2.78,-3.46],[2.25,3.54,.08],'#718989',null,{material:'metal'});
    for(const dx of[-1.2,1.2])b.box([x+dx,2.78,-3.18],[.16,3.9,.6],P.brass,null,metal);
    for(const y of[.86,4.7])b.box([x,y,-3.18],[2.58,.16,.6],P.brass,null,metal);
    b.box([x,2.78,-2.85],[2.25,3.54,.035],'#b5c4c1',null,{material:'glass',opacity:.18,castShadow:false});
    const shift=i===0?-pos*.008:i===1?pos*.006:delay*.008;
    const turn=i===0?-angle:i===1?angle:-delayAngle;
    b.box([x+shift,2.36,-3.06],[i===1?.65*(1+Math.abs(pos)/180):.65,i===1?.65*(1-Math.abs(pos)/250):.65,.46],colors[i],[.25,turn,.55],{material:'metal'});
    b.cylinder([x+shift,1.7,-3.06],[.035,.59,.035],'#b8bdac',null,metal);
    b.cylinder([x+shift,1.38,-3.06],[.37,.08,.27],'#a4b0a4',null,metal);
    b.box([x,.69,-2.91],[.84,.19,.06],P.paper,null,paper);
  }
  table(b,{z:2.15,width:7.8,depth:1.65,height:1.62,color:'#8d6e58'});
  b.box([0,1.79,2.15],[6.5,.15,.34],P.dark,null,metal);
  for(const x of[-3.25,3.25])b.sphere([x,1.79,2.15],[.12,.12,.12],P.brass,null,metal);
  const original=pos*.028;
  b.cylinder([original,1.92,2.15],[.37,.12,.3],'#809186',null,metal);
  b.cylinder([original,2.18,2.15],[.035,.44,.035],P.brass,null,metal);
  b.box([original,2.61,2.15],[.8,.8,.8],'#b87860',[.25,angle,.55],{material:'metal'});
  b.sphere([original,2.61,2.65],[.075,.075,.06],'#e3c995',null,{emissive:.18});
  pendant(b,.6,.4,{y:5.05,color:'#806550'});
  cabinet(b,-4.2,-.9,1.4,'#66746f');notebook(b,-4.2,2.94,-.82,.12);
  // The edge of a stored, turned-away mirror creates foreground occlusion.
  b.box([4.68,1.84,3.8],[.16,3.55,1.04],P.edge,[0,.25,0],wood);
  b.box([4.61,1.84,3.8],[.04,3.3,.84],'#7c8b84',[0,.25,0],metal);
  return scene(b,[
    {id:'mirror-object',label:'Move the object along its rail',position:[original,2.66,2.53],href:'#mi-position'},
    {id:'mirror-angle',label:'Turn the object',position:[0,1.82,2.48],href:'#mi-angle'}
  ],{target:[0,2.5,-1.25],eye:[.6,3.9,9.7],lamp:[.6,4.85,.4],ambient:.61,
    detail:{eye:[-1.5,3.4,6.8],target:[original*.3,2.5,-.4]},mobileDetail:{eye:[original+.55,3.1,5.7],target:[original,2.58,2.15]}});
}

/** viewState: signal 0/1/2 and screenOpen boolean. */
export function makeTraffic(state={},viewState={}){
  const b=builder(),signal=Math.round(clamp(viewState.signal,0,2)),screenOpen=viewState.screenOpen===true;
  shell(b,{wall:'#a6a694',side:'#788a88',floor:'#867463',rug:'#8e6e53'});
  cabinet(b,3.1,-5.15,2.6,'#5c7270');
  // Deep wooden signal case, with visible copper runs behind the active route.
  b.box([-2.45,2.99,-3.7],[3.7,3.9,.6],P.edge,null,wood);
  b.box([-2.45,2.99,-3.35],[3.4,3.6,.1],'#516f67',null,metal);
  const start=[-3.73,3.45,-3.23],junction=[-2.63,3.45,-3.23],ys=[4.07,2.98,1.91],colors=['#bd7c63','#c4aa66','#76ac96'];
  b.cylinder(start,[.19,.08,.19],P.brass,[Math.PI/2,0,0],metal);
  for(let i=0;i<3;i++){
    const points=[start,junction,[-1.92,ys[i],-3.23],[-1.19,ys[i],-3.23]];
    for(let j=0;j<points.length-1;j++)b.beam(points[j],points[j+1],i===signal?.045:.028,i===signal?colors[i]:'#8d8b70',{material:'metal',emissive:i===signal?.35:0});
    b.cylinder([-1.16,ys[i],-3.21],[.23,.13,.23],P.dark,[Math.PI/2,0,0],metal);
    b.sphere([-1.16,ys[i],-3.1],[.16,.16,.06],i===signal?colors[i]:'#69796c',null,{emissive:i===signal?.7:0});
  }
  // The full game opens in the existing real game surface. This is a physical
  // idle monitor, never a fabricated miniature Traffic simulation.
  b.box([2.0,3.16,-3.48],[3.45,2.6,.52],'#344d50',null,metal);
  b.box([2.0,3.2,-3.19],[3.02,2.13,.025],screenOpen?'#54796b':'#223d42',null,{emissive:screenOpen?.22:.02});
  b.box([2.0,3.2,-3.16],[2.98,2.09,.025],'#a7c5b5',null,{material:'glass',opacity:.08,castShadow:false});
  b.sphere([3.34,2.03,-3.15],[.065,.065,.035],screenOpen?'#b3d1a0':'#b39562',null,{emissive:.7});
  b.cylinder([2.0,1.65,-3.5],[.12,.48,.12],P.dark,null,metal);
  b.box([2.0,1.4,-3.48],[1.6,.12,.65],P.dark,null,metal);
  table(b,{z:.45,width:8.1,depth:2.35,height:1.7,color:'#907151'});
  b.box([-2.45,1.92,.57],[1.7,.25,1.27],'#637c70',null,metal);
  b.cylinder([-2.45,2.12,.57],[.3,.16,.3],P.brass,null,metal);
  const leverAngle=[-.55,0,.55][signal],end=[-2.45+Math.sin(leverAngle)*.67,2.15+Math.cos(leverAngle)*.67,.57];
  b.beam([-2.45,2.12,.57],end,.06,P.dark,metal);b.sphere(end,[.18,.18,.18],'#ad7457',null,wood);
  for(let i=0;i<3;i++){
    const x=.45+i*1.14;b.cylinder([x,1.91,.44],[.23,.14,.23],P.dark,null,metal);
    b.sphere([x,2.0,.44],[.18,.09,.18],i===signal?colors[i]:'#77816c',null,{emissive:i===signal?.7:0});
  }
  pendant(b,-1.45,1.2,{y:4.9,color:'#836a52'});chair(b,.2,3.55,'#7a6958');notebook(b,3.18,1.87,1.22,-.11);
  // A single coiled cable gives the monitor its physical connection.
  for(let i=0;i<9;i++){const a=i/9*Math.PI*1.7,c=(i+1)/9*Math.PI*1.7;b.beam([3.65+Math.cos(a)*.28,1.85,1.0+Math.sin(a)*.28],[3.65+Math.cos(c)*.28,1.85,1.0+Math.sin(c)*.28],.025,P.dark);}
  return scene(b,[
    {id:'switch',label:'Route the exhibit signal',position:end,href:'#tr-response'},
    {id:'traffic-screen',label:screenOpen?'Close the Traffic screen':'Play the existing Traffic game',position:[2.0,3.2,-3.0],href:'#tr-play'}
  ],{target:[0,2.5,-1.25],eye:[.8,4.4,9.6],lamp:[-1.45,4.7,1.2],
    detail:{eye:[-1.35,3.1,5.4],target:[-1.5,2.8,-1.3]},mobileDetail:{eye:[-1.8,3.3,4.7],target:[-2.2,2.9,-2.3]}});
}
