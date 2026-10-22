// Real mesh sets for the quieter corners of the lab. Scene data only.
// Box dimensions are extents; cylinders/spheres use radial x/z dimensions.
const C = { wall:'#c4bcaa', side:'#afb5a2', ceiling:'#d2cbb7', floor:'#aa9d85', joint:'#938b77', wood:'#9c7753', edge:'#765b41', cream:'#ebe1c5', paper:'#f0e7cf', steel:'#56726a', dark:'#354e49', brass:'#b79b62', shadow:'#8e917a', rug:'#925e56', ink:'#657c70' };
const limit = (n,a,b,f=0) => Number.isFinite(Number(n)) ? Math.min(b,Math.max(a,Number(n))) : f;
function builder() {
  const objects=[];
  const shape=(type,position,size,color,rotation,extra={})=>{const o={type,position,size,color,...extra};if(rotation)o.rotation=rotation;objects.push(o);return o;};
  const box=(p,s,c,r,extra)=>shape('box',p,s,c,r,extra);
  const cylinder=(p,s,c,r,extra)=>shape('cylinder',p,s,c,r,extra);
  const sphere=(p,s,c,r,extra)=>shape('sphere',p,s,c,r,extra);
  const beam=(a,z,w,c=C.steel,extra={})=>{
    const d=z.map((v,i)=>v-a[i]),length=Math.hypot(...d);
    if(length<.0001)return;
    return box(a.map((v,i)=>(v+z[i])/2),[w,length,w],c,[Math.atan2(d[2],d[1]),0,-Math.asin(d[0]/length)],extra);
  };
  return {objects,box,cylinder,sphere,beam};
}
function room(b,{wall=C.wall,side=C.side,floor=C.floor,roof=true,rearOpening=false}={}) {
  b.box([0,-.13,0],[12.4,.26,12.6],floor,undefined,{material:'wood'});
  for(const x of [-4,-2,0,2,4])b.box([x,.005,0],[.014,.012,12.3],C.joint);
  if(rearOpening){
    b.box([0,1.05,-6.2],[12.4,2.1,.25],wall,undefined,{material:'plaster'});
    b.box([0,6.075,-6.2],[12.4,.25,.25],wall,undefined,{material:'plaster'});
    for(const x of[-5.48,5.48])b.box([x,4.025,-6.2],[1.44,3.85,.25],wall,undefined,{material:'plaster'});
  }else b.box([0,3.1,-6.2],[12.4,6.2,.25],wall,undefined,{material:'plaster'});
  b.box([-6.2,3.1,0],[.25,6.2,12.6],side,undefined,{material:'plaster'});
  b.box([6.2,3.1,0],[.25,6.2,12.6],wall,undefined,{material:'plaster'});
  b.box([0,.17,-6.03],[12,.34,.12],C.steel);
  b.box([-6.03,.17,0],[.12,.34,12],C.steel);
  b.box([6.03,.17,0],[.12,.34,12],C.steel);
  if(roof){
    b.box([-4.6,6.25,0],[3.3,.2,12.4],C.ceiling);
    b.box([4.6,6.25,0],[3.3,.2,12.4],C.ceiling);
    b.box([0,6.25,4.65],[5.9,.2,3.1],C.ceiling);
    b.box([0,6.25,-5.35],[5.9,.2,1.7],C.ceiling);
    b.box([0,6.28,-.65],[5.9,.035,7.7],'#e5e1c7',undefined,{material:'glass',opacity:.15,castShadow:false});
    for(const z of [-4.5,-1.95,.6,3.15])b.box([0,6.13,z],[6,.16,.12],C.steel);
    b.box([0,6.12,-.65],[.12,.16,7.8],C.steel);
  }
}
function rug(b,x,z,w,d,color=C.rug) {
  b.box([x,.018,z],[w,.025,d],color,undefined,{material:'cloth',castShadow:false});
  b.box([x,.033,z],[w-.2,.008,d-.2],'#b39677',undefined,{castShadow:false});
  b.box([x,.039,z],[w-.32,.008,d-.32],color,undefined,{castShadow:false});
  for(const side of [-1,1]) b.box([x+side*(w/2-.37),.045,z],[.065,.008,d-.48],'#b69d78',undefined,{castShadow:false});
}
function table(b,x,z,w,d,h=1.8) {
  b.box([x,.015,z],[w+.25,.02,d+.2],C.shadow,undefined,{castShadow:false});
  for(const sx of [-1,1])for(const sz of [-1,1])b.box([x+sx*(w/2-.22),h/2,z+sz*(d/2-.2)],[.17,h,.17],C.steel,undefined,{material:'metal'});
  b.box([x,h,z],[w,.19,d],C.wood,undefined,{material:'wood'});
  b.box([x,h-.16,z+d/2-.1],[w-.2,.18,.15],C.edge,undefined,{material:'wood'});
}
function pendant(b,x,z,y=4.5) {
  b.cylinder([x,(6.2+y+.2)/2,z],[.018,6.2-y-.2,.018],C.dark);
  b.cylinder([x,y+.1,z],[.39,.25,.39],C.steel,undefined,{material:'metal'});
  b.cylinder([x,y-.045,z],[.46,.055,.46],'#ead4a2',undefined,{emissive:.35,castShadow:false});
}
function cabinet(b,x,z,width=1.8,height=2.6) {
  b.box([x,.014,z],[width+.14,.02,.9],C.shadow,undefined,{castShadow:false});
  b.box([x,height/2,z],[width,height,.74],C.steel,undefined,{material:'metal'});
  for(let i=0;i<3;i++){
    const y=.4+i*(height-.2)/3;
    b.box([x,y,z+.39],[width-.12,(height-.3)/3-.08,.06],'#718379',undefined,{material:'metal'});
    b.box([x,y+.1,z+.44],[.34,.05,.04],'#b7b7a0',undefined,{material:'metal'});
    b.box([x,y-.13,z+.43],[.45,.13,.015],'#d4ccb4',undefined,{material:'paper'});
  }
}
function cameras(centerEye,centerTarget,leftTarget,rightTarget,detail,mobileDetail) {
  return {center:{eye:centerEye,target:centerTarget},left:{eye:[centerEye[0]-1,centerEye[1],centerEye[2]-.2],target:leftTarget},right:{eye:[centerEye[0]+1,centerEye[1],centerEye[2]-.2],target:rightTarget},detail,'mobile-detail':mobileDetail||detail,'mobile-center':{eye:[centerEye[0],centerEye[1]+.65,centerEye[2]+2],target:centerTarget},'mobile-left':{eye:[centerEye[0]-1,centerEye[1]+.2,centerEye[2]+.8],target:leftTarget},'mobile-right':{eye:[centerEye[0]+1,centerEye[1]+.2,centerEye[2]+.8],target:rightTarget}};
}
function finish(b,hotspots,views,extras={}) {return {objects:b.objects,hotspots,camera:views.center,cameras:views,sun:[-.7,1,.25],lightColor:'#ffe0aa',ambient:.56,fogColor:'#b8b9a3',...extras};}

export function makeLibrary(state={},viewState={}) {
  const b=builder(),book=Math.round(limit(viewState.book??viewState.selected,0,2)),open=limit(viewState.opening??74,0,100)/100;
  room(b,{wall:'#c7bcad',side:'#a6afa0'});
  rug(b,0,1.15,6.7,5.1,'#8a605d');
  // Shelves hold small groups of well-used books, with space around them.
  for(const x of [-3.7,3.7]){
    b.box([x,2.05,-5.52],[3.1,4.1,.6],C.edge,undefined,{material:'wood'});
    b.box([x,2.1,-5.15],[2.85,3.8,.04],'#7f806b');
    for(const y of [.62,1.75,2.88,4.05])b.box([x,y,-5.03],[3.12,.12,.95],C.wood,undefined,{material:'wood'});
    for(let i=0;i<10;i++){
      const row=i<5?1:2,col=i%5;
      const h=.58+(i%3)*.12;
      b.box([x-1.1+col*.48,(row===1?1.81:2.94)+h/2,-4.9],[.3,h,.51],['#716f76','#59766e','#a28358','#9c6557','#bdab87'][i%5],[0,0,(i%4===0?.075:0)],{material:'paper'});
    }
  }
  // A narrow evidence drawer remains part of the working room, not a shop display.
  cabinet(b,0,-5.45,1.9,1.8);
  b.box([0,2.01,-5.45],[1.45,.16,.8],'#b8ab86',undefined,{material:'paper'});
  table(b,0,.45,5.5,3.5,1.85);
  pendant(b,-.8,.7,4.45);
  const baseY=1.975,fold=(1-open)*1.42;
  b.box([0,baseY,.5],[3.7,.09,2.35],'#785761',undefined,{material:'wood'});
  // Both covers hinge about the spine. Popup pieces rise from the page crease.
  for(const side of [-1,1]){
    const ang=side*fold;
    b.box([side*.88*Math.cos(fold),baseY+.12+.88*Math.sin(fold),.5],[1.76,.08,2.2],C.paper,[0,0,ang],{material:'paper'});
  }
  b.box([.02,baseY+.13,1.65],[.1,.025,.36],'#ad715d',undefined,{material:'cloth'});
  const pop=(type,p,s,c,r,extra={})=>{
    const scale=Math.max(.025,open);
    return b[type]([p[0],baseY+.2+(p[1]-(baseY+.2))*scale,p[2]],[s[0],s[1]*scale,s[2]],c,r,{material:'paper',...extra});
  };
  if(book===0){
    for(let i=0;i<5;i++)pop('box',[0,2.24+i*.055,-.28+i*.38],[2.96,.06,.6],['#8eafad','#799fa6','#608a96','#507582','#486874'][i],[(-1)**i*.18,0,0]);
    pop('box',[-.18,2.49,.3],[.86,.16,.27],'#b48b65',[0,.15,.03]);
    pop('cylinder',[-.1,2.97,.3],[.025,.9,.025],C.brass);
    pop('box',[.11,3,.3],[.44,.72,.025],C.paper,[0,.15,-.22]);
    pop('box',[1.08,2.76,-.18],[.26,.92,.26],'#b4ab8e');
    pop('sphere',[1.08,3.3,-.18],[.17,.16,.17],'#efe4ad',undefined,{emissive:.15});
  }else if(book===1){
    for(const [x,z,h,w,col]of[[-.82,-.35,1.15,.85,'#809c92'],[.3,-.5,1.7,1.05,'#9eafa1'],[1,.35,.87,.74,'#ba9c7d'],[-.4,.52,.66,.75,'#bdac8a']]){
      const rise=h*open,tilt=Math.atan2(rise,w/2),slope=Math.hypot(w/2,rise);
      for(const side of [-1,1])b.box([x+side*w/4,baseY+.2+rise/2,z],[slope,.025,1.03],side<0?col:'#758b80',[0,0,-side*tilt],{material:'paper'});
    }
    pop('sphere',[.65,3.82,-.5],[.32,.08,.18],'#e9ddc0');
    pop('sphere',[-1,3.25,-.3],[.28,.07,.15],'#e9ddc0');
  }else{
    for(let i=0;i<3;i++){
      const x=-.92+i*.91,z=.13+(i%2)*.53;
      pop('cylinder',[x,2.62,z],[.022,.9,.022],'#6d927a');
      for(const side of[-1,1])pop('sphere',[x+side*.19,2.52,z],[.26,.07,.13],side<0?'#809a79':'#9aae8b',[0,0,side*.5]);
      pop('sphere',[x,3.09,z],[.24,.1,.24],['#b595a5','#c3a897','#a1a6bf'][i]);
      pop('sphere',[x,3.14,z],[.075,.075,.075],'#ddc78a');
    }
    pop('sphere',[.5,3.62,-.45],[.36,.36,.08],'#e6d5aa');
  }
  // Three source volumes remain individually reachable on the near reading edge.
  for(let i=0;i<3;i++){
    b.box([-1.88+i*1.9,2.01,1.93],[.62,.12,.76],['#587c79','#b08b7e','#7f7d9b'][i],[0,(i-1)*.09,0],{material:'paper'});
    b.box([-1.88+i*1.9,2.08,1.93],[.48,.014,.6],C.cream,[0,(i-1)*.09,0],{material:'paper'});
  }
  // A foreground chair and abandoned closed volume frame the table at human scale.
  b.box([-3.75,1.05,3.2],[1.08,.18,.98],'#7a8d76');
  b.box([-3.75,1.9,3.64],[1.12,1.35,.13],'#7a8d76');
  for(const x of[-4.13,-3.37])for(const z of[2.88,3.52])b.box([x,.48,z],[.1,.96,.1],C.edge);
  b.box([-4.3,.17,4.55],[1.15,.28,.8],'#86665b',[0,-.15,0],{material:'paper'});
  const hotspots=[...['Tide atlas','Folded weather','Night garden'].map((label,i)=>({id:`book-${i}`,label,position:[-1.88+i*1.9,2.2,1.93],href:`#book-${i}`})),{id:'book-fold',label:open>.5?'Fold the paper world':'Unfold the paper world',position:[0,2.5,.42],href:'#library-open'}];
  return finish(b,hotspots,cameras([.3,4.75,9.5],[0,2.05,-.6],[-1.4,2.1,-.2],[1.3,2.1,-.2],{eye:[.15,3.8,5.5],target:[0,2.45,.4]},{eye:[0,4.25,6.9],target:[0,2.35,.45]}),{lights:[{position:[-.8,4.2,.7],color:'#ffd294',intensity:.55}]});
}

export function makeObservatory(state={},viewState={}) {
  const b=builder(),bearing=limit(viewState.bearing??38,0,360),angle=bearing*Math.PI/180;
  const marbleY=limit(viewState.marbleY??(viewState.marblePhase==='returned'?94:423),-100,700,423);
  room(b,{wall:'#8f9d9c',side:'#8e9d93',floor:'#9d9b89',roof:false,rearOpening:true});
  // A framed opening above the rear parapet looks into actual distant sky meshes.
  b.box([0,5.1,-8.1],[15,8.8,.1],'#2d495c',undefined,{emissive:.14,castShadow:false});
  // The opening and overhead ribs share one continuous night beyond the room.
  b.box([0,8.18,-1.5],[30,.055,28],'#344f64',undefined,{emissive:.17,castShadow:false});
  for(let i=0;i<12;i++)b.sphere([-6.2+(i*2.19)%12.4,8.09,-5.5+(i*i*.77)%9.3],[.027+(i%4===0?.018:0),.023,.027],'#e7dbb9',undefined,{emissive:.75,castShadow:false});
  for(const x of[-4.85,4.85])b.box([x,4.05,-5.86],[.22,3.85,.25],C.steel);
  b.box([0,2.15,-5.86],[9.9,.21,.32],C.steel);
  b.box([0,5.93,-5.86],[9.9,.21,.32],C.steel);
  b.box([0,2.08,-6.35],[9.8,.17,1.25],'#abb4a2');
  for(const x of[-4.85,4.85])b.box([x,4.04,-6.35],[.19,3.8,1.05],'#71897d');
  for(let i=0;i<17;i++)b.sphere([-4.4+(i*1.67)%8.8,2.65+(i*i*.71)%2.7,-7.8],[.02+(i%5===0?.025:0),.02,.02],'#e9dec0',undefined,{emissive:.55,castShadow:false});
  b.sphere([3.23,4.85,-7.5],[.41,.41,.075],'#dbcba5',undefined,{emissive:.2,castShadow:false});
  // A partial dome's ribs curve over the observer; glazing is light, never opaque.
  for(const z of[-4.85,-1.4,2]){
    const arc=Array.from({length:9},(_,i)=>{const t=Math.PI*i/8;return[-5.5*Math.cos(t),5.9+1.45*Math.sin(t),z];});
    for(let i=0;i<8;i++)b.beam(arc[i],arc[i+1],.085,'#667e72',{material:'metal'});
  }
  for(const x of[-3.89,0,3.89])b.box([x,7.04-Math.abs(x)*.15,-1.4],[.075,.075,7],C.brass);
  b.cylinder([-3.89,5.49,1.9],[.017,1.93,.017],C.dark);
  b.cylinder([-3.89,4.46,1.9],[.36,.22,.36],C.steel,undefined,{material:'metal'});
  b.cylinder([-3.89,4.33,1.9],[.42,.05,.42],'#ead2a0',undefined,{emissive:.5,castShadow:false});
  rug(b,.2,.9,6,4.4,'#6c6d78');
  // A long optical tube on a tripod, with real sloping braces.
  const telescopePivot=[-2.6,2.65,.55];
  for(const end of[[-3.55,.05,1.2],[-1.65,.05,1.2],[-2.6,.05,-.35]])b.beam(telescopePivot,end,.09,C.brass,{material:'metal'});
  b.sphere(telescopePivot,[.2,.2,.2],C.steel,undefined,{material:'metal'});
  const opticalA=[-3.2,2.35,1.08],opticalB=[-1.6,3.27,-.33];
  const d=opticalB.map((v,i)=>v-opticalA[i]),length=Math.hypot(...d),rot=[Math.atan2(d[2],d[1]),0,-Math.asin(d[0]/length)];
  b.cylinder(opticalA.map((v,i)=>(v+opticalB[i])/2),[.24,length,.24],'#657f75',rot,{material:'metal'});
  b.sphere(opticalB,[.26,.26,.13],'#bed3ca',[.6,-.85,0],{material:'glass',opacity:.55});
  b.sphere(opticalA,[.13,.13,.13],C.dark);
  // A tactile constellation on a small chart table; the sky-turn control rotates it.
  b.cylinder([.35,.73,-1.15],[.53,1.46,.53],C.steel,undefined,{material:'metal'});
  b.cylinder([.35,1.55,-1.15],[1.78,.18,1.78],C.wood,undefined,{material:'wood'});
  b.cylinder([.35,1.66,-1.15],[1.63,.035,1.63],'#415c62');
  const points=Array.from({length:7},(_,i)=>{const a=i*.77+angle;return[.35+Math.cos(a)*(1.02+i*.05),1.88+Math.sin(a*.6)*.21,-1.15+Math.sin(a)*(1.02+i*.05)];});
  for(let i=0;i<points.length;i++){
    if(i)b.beam(points[i-1],points[i],.025,'#a7b9ad',{castShadow:false});
    b.sphere(points[i],[.055+(i%3)*.012,.055,.055],'#e4d7b4',undefined,{emissive:.28});
  }
  b.cylinder([.35,1.79,.56],[.18,.12,.18],C.brass,undefined,{material:'metal'});
  // The marble's resting pedestal lines up with a ceiling/floor return aperture.
  b.cylinder([3.25,1.02,1.08],[.58,2.04,.58],C.steel,undefined,{material:'metal'});
  b.cylinder([3.25,2.07,1.08],[.64,.09,.64],C.brass,undefined,{material:'metal'});
  b.cylinder([3.25,.012,1.08],[.71,.015,.71],C.shadow,undefined,{castShadow:false});
  b.cylinder([3.25,6.1,1.08],[.48,.14,.48],C.brass,undefined,{material:'metal'});
  b.cylinder([3.25,6.02,1.08],[.32,.025,.32],C.dark,undefined,{castShadow:false});
  const y=6.515-marbleY/100;
  b.sphere([3.25,y,1.08],[.17,.17,.17],'#d8e6b5',undefined,{emissive:.8,castShadow:false});
  b.sphere([3.2,y+.055,1.19],[.045,.045,.045],'#f5e7c1',undefined,{emissive:1,castShadow:false});
  cabinet(b,-4.8,-4.75,1.5,2.05);
  b.box([-4.8,2.22,-4.72],[1.05,.22,.67],'#a78b65',undefined,{material:'paper'});
  // A worn step and a low foreground bench make this an occupied observation room.
  table(b,-3.85,4.2,2.4,1.12,.82);
  b.box([-3.8,.95,4.15],[.9,.12,.63],'#748786',[0,-.16,0],{material:'paper'});
  return finish(b,[{id:'sky-turn',label:'Turn the constellation',position:[.35,1.95,.55],href:'#observatory-turn'},{id:'marble-drop',label:'Drop the luminous marble',position:[3.25,Math.max(2.3,Math.min(4.4,y)),1.08],href:'#observatory-drop'}],cameras([.3,4.4,10],[0,2.4,-1.2],[-1.8,2.6,-.6],[2.1,2.8,.2],{eye:[2.4,4.8,8],target:[1.4,3.25,.1]},{eye:[1.7,4.8,9.5],target:[1.7,3.2,.2]}),{sun:[-.4,1,-.5],lightColor:'#cfdde2',ambient:.49,lights:[{position:[-3.89,4.2,1.9],color:'#e2ba77',intensity:.75},{position:[3.25,y,1.08],color:'#dcebb5',intensity:.25}],fogColor:'#91a39c'});
}

export function makeConservatory(state={},viewState={}) {
  const b=builder(),rain=limit(state.rain,0,100),clouds=Math.round(limit(state.clouds??1,0,3)),plant=Math.round(limit(state.plant,0,2));
  // Timber knee walls, individual clear panes and a pitched glass roof.
  b.box([0,-.13,0],[12.4,.26,12.6],'#ad9b82',undefined,{material:'wood'});
  for(const x of[-4,-2,0,2,4])b.box([x,.006,0],[.018,.014,12.2],'#958f78');
  b.box([0,.65,-6.15],[12.4,1.3,.25],C.steel,undefined,{material:'wood'});
  for(const side of[-1,1])b.box([side*6.15,.65,0],[.25,1.3,12.4],C.steel,undefined,{material:'wood'});
  b.box([0,3.4,-6.3],[12,4.2,.06],'#c4d0bb',undefined,{material:'glass',opacity:.27,castShadow:false});
  for(const side of[-1,1])b.box([side*6.3,3.4,0],[.06,4.2,12],'#b8cdb7',undefined,{material:'glass',opacity:.2,castShadow:false});
  for(const x of[-6,-3,0,3,6])b.box([x,3.15,-6],[.12,5.9,.12],C.steel,undefined,{material:'metal'});
  for(const side of[-1,1])for(const z of[-6,-2.1,1.8,5.7])b.box([side*6,3.15,z],[.12,5.9,.12],C.steel,undefined,{material:'metal'});
  for(const y of[1.35,3.5,5.95]){
    b.box([0,y,-6],[12,.12,.12],C.steel);
    for(const side of[-1,1])b.box([side*6,y,0],[.12,.12,12],C.steel);
  }
  for(const z of[-6,-1.9,2.2,6])for(const side of[-1,1])b.beam([side*6,6,z],[0,7.75,z],.13,C.steel,{material:'metal'});
  b.box([0,7.74,0],[.15,.15,12],C.steel);
  for(const side of[-1,1])b.box([side*3,6.875,0],[6.25,.035,11.8],'#e3dfc3',[0,0,side*-.284],{material:'glass',opacity:.12,castShadow:false});
  // A working potting bench, seed tray and three hand-written packets at the back.
  table(b,-.7,-4.85,6.5,1.5,1.85);
  b.box([-.7,2.01,-4.8],[2.2,.17,.85],'#7b7355');
  for(let i=0;i<3;i++)b.box([2.2+i*.33,2,-4.88],[.25,.12,.57],['#c5b894','#a4ac8a','#c7a889'][i],[0,(i-1)*.1,0],{material:'paper'});
  b.cylinder([-3.05,2.14,-4.85],[.17,.4,.17],'#c3a783');
  // Weather hangs from one ordinary rail. Clouds are small material volumes.
  b.box([0,5.65,-.8],[8.9,.1,.12],C.brass,undefined,{material:'metal'});
  for(const x of[-4.4,4.4])b.cylinder([x,6.18,-.8],[.025,1.06,.025],C.steel);
  for(let i=0;i<clouds;i++){
    const x=-2.9+i*2.9;
    b.cylinder([x,5.3,-.8],[.015,.65,.015],C.steel);
    for(const [dx,dy,r]of[[-.5,0,.5],[0,.22,.67],[.55,.02,.48]])b.sphere([x+dx,4.77+dy,-.8],[r,r*.5,r*.6],rain>50?'#a8bbb2':'#e2deca',undefined,{castShadow:false});
    if(rain>0)for(let j=0;j<Math.ceil(rain/15);j++){
      const dx=((j*31)%9-4)*.14,y=2.6+(j%3)*.45;
      b.cylinder([x+dx,y,-.65+(j%2)*.28],[.012,.11+rain*.0016,.012],'#a0c4bd',[0,0,-.08],{emissive:.06,castShadow:false});
    }
  }
  for(let i=0;i<3;i++){
    const x=-2.9+i*2.9,z=.5+(i===1?.38:0),kind=(plant+i)%3,growth=.72+rain*.0028;
    b.cylinder([x,.022,z],[.85,.02,.7],C.shadow,undefined,{castShadow:false});
    b.cylinder([x,.44,z],[.62,.88,.62],['#b28265','#b8a478','#6e8e7e'][i],undefined,{material:'clay'});
    b.cylinder([x,.89,z],[.69,.13,.69],['#bd9071','#c1ae85','#7e9e8b'][i]);
    b.cylinder([x,.96,z],[.56,.025,.56],'#73654b');
    const stemTop=1.04+1.9*growth;
    b.cylinder([x,(1+stemTop)/2,z],[.025,stemTop-1,.025],'#608469');
    if(kind===0){
      for(let k=0;k<4;k++){
        const side=k%2?-1:1,y=1.22+k*.34*growth;
        b.sphere([x+side*.34,y,z],[.52*growth,.12,.3],k%2?'#759675':'#8fa881',[0,0,side*.5]);
      }
      b.sphere([x,stemTop,z],[.24,.46*growth,.2],'#8fa881',[0,0,.13]);
    }else if(kind===1){
      for(const side of[-1,1])b.sphere([x+side*.28,1.6,z],[.42,.09,.24],'#779477',[0,0,side*.4]);
      for(let k=0;k<5;k++){const a=k*Math.PI*2/5;b.sphere([x+Math.cos(a)*.26,stemTop,z+Math.sin(a)*.26],[.31,.1,.31],rain>50?'#c69892':'#c8b48a');}
      b.sphere([x,stemTop+.1,z],[.16,.14,.16],'#d6bd7b');
    }else{
      for(let k=0;k<7;k++){
        const a=k*.74,r=.18+k*.045;
        b.sphere([x+Math.cos(a)*r,1.45+k*.16*growth,z+Math.sin(a)*r],[.27,.1,.17],k%2?'#a4af80':'#7f9d75',[0,a,0]);
      }
    }
  }
  // Water remains on this floor until the user opens the physically visible drain.
  if(rain>0&&!state.gardenDrained)b.sphere([.1,.027,3.05],[.65+rain*.015,.013,.4+rain*.006],'#91b3a5',undefined,{material:'metal',castShadow:false});
  b.cylinder([3.62,.027,3.24],[.42,.05,.42],C.dark);
  for(let i=-2;i<=2;i++)b.box([3.62,.062,3.24+i*.12],[.66,.045,.035],'#9cae98',undefined,{material:'metal'});
  b.cylinder([3.62,.19,3.24],[.085,.25,.085],C.brass);
  b.box([3.62,.34,3.24],[.52,.07,.08],state.gardenDrained?'#7ba18d':'#b59b68',[0,state.gardenDrained?Math.PI/2:0,0],{material:'metal'});
  // Foreground watering can: handle and spout are legible rather than decorative noise.
  b.cylinder([-4.7,.42,3.9],[.43,.8,.43],C.steel,undefined,{material:'metal'});
  b.beam([-4.4,.55,3.9],[-3.88,.91,3.9],.12,C.steel,{material:'metal'});
  b.beam([-5.04,.72,3.9],[-5.18,1.17,3.9],.07,C.brass);
  b.beam([-5.18,1.17,3.9],[-4.66,1.12,3.9],.07,C.brass);
  const spots=[{id:'garden-cloud',label:'Compose the clouds',position:[-2.9,4.5,-.8],href:'#garden-cloud-control'},{id:'garden-rain',label:'Change the rain',position:[0,3.15,-.5],href:'#garden-rain-control'},{id:'garden-grow',label:'Rearrange the plants',position:[0,2.1,1],href:'#garden-grow'},{id:'garden-drain',label:state.gardenDrained?'Floor drained to the Hall':'Drain the floor to the Hall',position:[3.62,.6,3.24],href:'#garden-drain'}];
  return finish(b,spots,cameras([.15,4.6,10.7],[0,2.5,-.5],[-2.3,2.4,.1],[2.3,2.3,.5],{eye:[.2,4.5,7.6],target:[0,2.7,.4]},{eye:[0,4.6,9.2],target:[0,2.6,.6]}),{sun:[-.6,1,-.1],lightColor:'#ffedc1',ambient:.59,fogColor:'#b9c4ae'});
}

export function makePortal(state={},viewState={}) {
  const b=builder(),view=Math.round(limit(viewState.view??viewState.destination,0,2));
  room(b,{wall:'#bcb4aa',side:'#a6b1a3'});
  rug(b,.45,1.75,5.7,5.1,'#8e625c');
  // A freestanding deep frame; the space through it is made from actual meshes.
  const frameZ=-1.15;
  for(const x of[-2.05,2.05]){
    b.box([x,2.35,frameZ],[.34,4.7,.64],C.steel,undefined,{material:'metal'});
    b.box([x,2.35,frameZ+.34],[.065,4.35,.065],C.brass,undefined,{material:'metal'});
  }
  b.box([0,4.73,frameZ],[4.46,.35,.64],C.steel,undefined,{material:'metal'});
  b.box([0,4.55,frameZ+.34],[4,.065,.065],C.brass,undefined,{material:'metal'});
  b.box([0,.1,frameZ+.1],[4.6,.2,1],C.edge,undefined,{material:'wood'});
  b.box([0,.035,frameZ+.9],[4.9,.07,1.1],'#9f9781');
  // Shallow side cheeks hide the miniature's edge and give the aperture depth.
  for(const x of[-1.89,1.89])b.box([x,2.32,-2.53],[.08,4.3,2.2],['#9db6b7','#697b89','#8d9589'][view]);
  b.box([0,2.32,-3.65],[3.75,4.3,.08],['#a9c6c4','#435e70','#9da79a'][view],undefined,{emissive:.11,castShadow:false});
  b.box([0,.24,-2.5],[3.75,.07,2.3],['#829e9b','#777c83','#b0ad97'][view]);
  if(view===0){
    // Cloud sea, a small sailing boat, and stairs that stop before the shore.
    for(let i=0;i<5;i++)b.sphere([-1.4+i*.7,.58+(i%2)*.09,-2.85],[.56,.17,.32],'#d5dace',undefined,{emissive:.02});
    b.sphere([1.12,3.73,-3.54],[.36,.36,.08],'#e3d4a6',undefined,{emissive:.3,castShadow:false});
    b.box([-.45,1.63,-2.7],[1.07,.18,.36],'#b59170',[0,.16,-.05],{material:'wood'});
    b.cylinder([-.49,2.18,-2.7],[.025,1.15,.025],C.brass);
    b.box([-.2,2.25,-2.7],[.49,.89,.025],C.paper,[0,.16,-.2],{material:'paper'});
    for(let i=0;i<4;i++)b.box([-1.26+i*.32,.37+i*.22,-1.72-i*.2],[.55,.13,.48],'#c6c6b2');
  }else if(view===1){
    b.sphere([.65,3.25,-3.51],[.76,.76,.1],'#d7c3a3',undefined,{emissive:.18,castShadow:false});
    for(let i=0;i<9;i++)b.sphere([-1.6+(i*1.17)%3.2,1.2+(i*i*.43)%3,-3.51],[.024,.024,.024],'#e1d7b5',undefined,{emissive:.45,castShadow:false});
    for(let i=0;i<6;i++)b.box([-1.22+i*.4,.35+i*.38,-1.7-i*.3],[.53,.14,.53],'#a4b0ac');
    b.cylinder([1.3,1.47,-3.05],[.022,1.6,.022],C.brass);
    b.box([1.3,2.28,-3.05],[.44,.3,.09],'#c1b18e');
  }else{
    // A corridor after the adventure: swept stone, broom, and waiting bucket.
    for(let i=0;i<5;i++)b.box([0,.31,-1.53-i*.42],[3.65,.045,.026],'#8e9584');
    for(const x of[-1.2,1.2])b.box([x,2.24,-3.48],[.2,3.7,.13],'#778c7e');
    b.box([0,4.03,-3.48],[2.6,.2,.13],'#778c7e');
    b.box([.45,1.18,-2.54],[.07,1.85,.07],C.wood,[0,0,-.2],{material:'wood'});
    b.box([.64,.31,-2.54],[.7,.22,.24],'#bbab7c',[0,0,-.2]);
    b.cylinder([-.81,.57,-2.52],[.28,.62,.28],'#72918b',undefined,{material:'metal'});
    b.beam([-1.06,.89,-2.52],[-.81,1.15,-2.52],.035,C.brass);
    b.beam([-.81,1.15,-2.52],[-.56,.89,-2.52],.035,C.brass);
  }
  // A hand-sized selector on its own pedestal controls the destinations.
  b.box([3.03,.78,-.06],[.46,1.56,.46],C.steel,undefined,{material:'metal'});
  b.cylinder([3.03,1.64,-.06],[.45,.15,.45],C.brass,undefined,{material:'metal'});
  b.box([3.03,1.77,-.06],[.68,.09,.08],C.dark,[0,view*Math.PI*2/3,0],{material:'metal'});
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;b.sphere([3.03+Math.cos(a)*.31,1.75,-.06+Math.sin(a)*.31],[.045,.045,.045],i===view?'#e4ce8d':'#8d967e',undefined,{emissive:i===view?.2:0});}
  cabinet(b,-4.6,-4.4,2,2.65);
  b.box([-4.6,2.86,-4.4],[1.35,.16,.76],'#a9926d',undefined,{material:'paper'});
  b.box([-4.6,3.03,-4.4],[1.2,.14,.69],'#7e8178',undefined,{material:'paper'});
  pendant(b,-3.6,.5,4.75);
  // The parcel is physically present until sent, leaving its small return mat.
  b.box([-2.85,.035,2.05],[1.32,.045,1.08],'#a99c7e');
  if(!state.portalGift){
    b.box([-2.85,.47,2.05],[.94,.86,.75],'#b89b71',[0,-.14,0],{material:'paper'});
    b.box([-2.85,.91,2.05],[.11,.025,.77],'#6d8d7b',[0,-.14,0]);
    b.box([-2.85,.48,2.43],[.11,.86,.025],'#6d8d7b',[0,-.14,0]);
  }
  // A modest near chair and wall-mounted evidence frame retain the private-lab scale.
  b.box([4.5,1.02,3.25],[1.08,.16,1.03],'#946b58');
  b.box([4.5,1.9,3.7],[1.13,1.38,.13],'#946b58');
  for(const x of[4.1,4.9])for(const z of[2.88,3.61])b.box([x,.47,z],[.1,.94,.1],C.dark);
  b.box([4.2,3.86,-5.95],[2.1,1.5,.1],C.edge);
  b.box([4.2,3.86,-5.87],[1.9,1.3,.025],'#d0c4a5',undefined,{material:'paper'});
  b.box([4.2,3.86,-5.84],[1.5,.055,.02],'#a19376',[0,0,.13]);
  const spots=[{id:'portal-turn',label:'Turn the destination dial',position:[3.03,1.98,-.06],href:'#portal-turn'},{id:'portal-send',label:state.portalGift?'Parcel delivered to the Hall':'Send the small parcel',position:[-2.85,state.portalGift?.55:1.04,2.05],href:'#portal-send'}];
  if(view===2)spots.push({id:'portal-discovery',label:'Discover Dungeon Reset',position:[0,2,-2.3],href:'/games/dungeon-reset/'});
  return finish(b,spots,cameras([.35,4.05,10.4],[0,2,-.4],[-2,1.9,.2],[2,2.1,-.4],{eye:[.3,3.4,6.9],target:[0,2.3,-1.8]},{eye:[.15,3.6,8],target:[0,2.2,-1.7]}),{lights:[{position:[-3.6,4.55,.5],color:'#edc28a',intensity:.62},{position:[0,3,-2.8],color:view===1?'#b3c5e1':'#d5dfc0',intensity:.3}]});
}
