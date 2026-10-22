// Small, dependency-free WebGL scene renderer. All surfaces are real 3D meshes.
// Authored cameras keep the scene bounded; HTML links provide equivalent access.
const VERTEX=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uModel;uniform mat3 uNormal;uniform mat4 uView;uniform mat4 uProjection;uniform mat4 uLightMatrix;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;void main(){vec4 world=uModel*vec4(aPosition,1.);vWorld=world.xyz;vNormal=normalize(uNormal*aNormal);vShadow=uLightMatrix*world;gl_Position=uProjection*uView*world;}`;
const FRAGMENT=`uniform vec3 uColor;uniform vec3 uEye;uniform vec3 uSun;uniform sampler2D uShadowMap;uniform float uShadowEnabled;uniform float uShadowTexel;uniform float uShadowBias;uniform vec4 uDepthDecode;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;
float sunVisibility(float diffuse){
 if(uShadowEnabled<.5)return 1.;
 vec3 p=vShadow.xyz/vShadow.w*.5+.5;
 if(p.x<=0.||p.x>=1.||p.y<=0.||p.y>=1.||p.z<=0.||p.z>=1.)return 1.;
 float bias=uShadowBias;vec2 depthGradient=vec2(0.);
 #ifdef RECEIVER_PLANE_DEPTH
 // Compare each tap with the receiver plane at that texel, not with the
 // center's depth. This removes floor acne without lifting contact shadows.
 vec3 dx=dFdx(p),dy=dFdy(p);float determinant=dx.x*dy.y-dx.y*dy.x;
 if(abs(determinant)>.00000001)depthGradient=clamp(vec2(dy.y*dx.z-dx.y*dy.z,dx.x*dy.z-dy.x*dx.z)/determinant,vec2(-10.),vec2(10.));
 #else
 float slope=sqrt(max(0.,1.-diffuse*diffuse))/max(diffuse,.2);
 bias+=min(.005,uShadowTexel*slope*1.5);
 #endif
 float visible=0.;
 for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
  vec2 tap=(floor(p.xy/uShadowTexel)+vec2(float(x),float(y))+.5)*uShadowTexel;
  float depth=dot(texture2D(uShadowMap,tap),uDepthDecode);
  visible+=step(p.z+dot(depthGradient,tap-p.xy)-bias,depth);
 }
 return visible/9.;
}
void main(){vec3 n=normalize(vNormal);float diffuse=max(dot(n,uSun),0.);float visibility=sunVisibility(diffuse);
 // Warm daylight stays welcoming in shadow; only direct sun is occluded.
 float hemisphere=.60+.075*(n.y*.5+.5);float bounce=max(-n.y,0.)*.065;
 float rim=max(dot(n,normalize(vec3(.65,.35,-.8))),0.)*.07;
 vec3 c=uColor*(vec3(hemisphere+bounce+rim)+vec3(1.,.94,.80)*diffuse*visibility*.42);
 float grain=(fract(sin(dot(floor(vWorld*90.),vec3(12.9898,78.233,45.164)))*43758.5453)-.5)*.012;c+=grain;
 float fog=clamp((distance(vWorld,uEye)-15.)*.013,0.,.22);c=mix(c,vec3(.80,.82,.73),fog);gl_FragColor=vec4(c,1.);}`;
const SHADOW_VERTEX=`attribute vec3 aPosition;uniform mat4 uModel;uniform mat4 uLightMatrix;void main(){gl_Position=uLightMatrix*uModel*vec4(aPosition,1.);}`;
const SHADOW_PACKED=`void main(){vec4 encoded=fract(min(gl_FragCoord.z,.999999)*vec4(1.,255.,65025.,16581375.));encoded-=encoded.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=encoded;}`;
const SHADOW_RED=`void main(){gl_FragColor=vec4(gl_FragCoord.z,0.,0.,1.);}`;
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b){const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
const normal=v=>{const length=Math.hypot(...v)||1;return v.map(n=>n/length);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
function lookAt(eye,target){const z=normal(eye.map((n,i)=>n-target[i])),x=normal(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(aspect){const f=1/Math.tan(52*Math.PI/360),near=.1,far=80;return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function orthographic(left,right,bottom,top,near,far){return[2/(right-left),0,0,0,0,2/(top-bottom),0,0,0,0,-2/(far-near),0,-(right+left)/(right-left),-(top+bottom)/(top-bottom),-(far+near)/(far-near),1];}
// The authored models are rotation × scale: divide each rotated column by its
// squared length to obtain the inverse transpose, including nonuniform scales.
function normalMatrix(m){const out=[];for(const c of[0,4,8]){const d=m[c]*m[c]+m[c+1]*m[c+1]+m[c+2]*m[c+2]||1;out.push(m[c]/d,m[c+1]/d,m[c+2]/d);}return out;}
function transformedPoint(m,p){return[0,1,2].map(r=>m[r]*p[0]+m[4+r]*p[1]+m[8+r]*p[2]+m[12+r]);}
function lightMatrix(objects,sun){
 const lightView=lookAt(sun.map(n=>n*35),[0,0,0]),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const o of objects){const extent=o.type==='box'||!o.type?[.5,.5,.5]:o.type==='cylinder'?[1,.5,1]:[1,1,1];const m=multiply(lightView,o.matrix);for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1]){const p=transformedPoint(m,[x*extent[0],y*extent[1],z*extent[2]]);for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],p[i]);hi[i]=Math.max(hi[i],p[i]);}}}
 return multiply(orthographic(lo[0]-.7,hi[0]+.7,lo[1]-.7,hi[1]+.7,-hi[2]-1,-lo[2]+1),lightView);
}
// The two pale panes represent glazing, not opaque structural walls. Explicit
// castShadow metadata takes precedence; all frames and ceiling panels cast.
function castsShadow(o){if(typeof o.castShadow==='boolean')return o.castShadow;const p=o.position||[],s=o.size||[];return !((o.color==='#f6f0d2'&&p[1]>6.8&&s[1]<.1)||(o.color==='#f4edc7'&&s[0]<.1));}
function modelMatrix(object){const p=object.position||[0,0,0],s=object.size||[1,1,1],r=object.rotation||[0,0,0];let m=identity();m[12]=p[0];m[13]=p[1];m[14]=p[2];for(let axis=0;axis<3;axis++){const a=r[axis]||0,c=Math.cos(a),n=Math.sin(a),rotation=identity();if(axis===0){rotation[5]=c;rotation[6]=n;rotation[9]=-n;rotation[10]=c;}if(axis===1){rotation[0]=c;rotation[2]=-n;rotation[8]=n;rotation[10]=c;}if(axis===2){rotation[0]=c;rotation[1]=n;rotation[4]=-n;rotation[5]=c;}m=multiply(m,rotation);}const scale=identity();scale[0]=s[0];scale[5]=s[1];scale[10]=s[2];return multiply(m,scale);}
function mesh(type){const vertices=[],normals=[];const tri=(a,b,c,n)=>{vertices.push(...a,...b,...c);normals.push(...n,...n,...n);};if(type==='box'){
 const faces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]];for(const[n,q]of faces){tri(q[0],q[1],q[2],n);tri(q[0],q[2],q[3],n);}
 }else if(type==='cylinder'){for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12,n=[Math.cos((a+b)/2),0,Math.sin((a+b)/2)],p=[Math.cos(a),-.5,Math.sin(a)],q=[Math.cos(b),-.5,Math.sin(b)],r=[q[0],.5,q[2]],s=[p[0],.5,p[2]];tri(p,q,r,n);tri(p,r,s,n);tri([0,.5,0],s,r,[0,1,0]);tri([0,-.5,0],q,p,[0,-1,0]);}
 }else{for(let i=0;i<12;i++)for(let j=0;j<20;j++){const point=(u,v)=>[Math.cos(u)*Math.sin(v),Math.cos(v),Math.sin(u)*Math.sin(v)],a=j*Math.PI/10,b=(j+1)*Math.PI/10,c=i*Math.PI/12,d=(i+1)*Math.PI/12;const q=[point(a,c),point(a,d),point(b,d),point(b,c)];for(const k of[0,1,2,0,2,3]){vertices.push(...q[k]);normals.push(...q[k]);}}}return{vertices:new Float32Array(vertices),normals:new Float32Array(normals)};}
const color=hex=>[1,3,5].map(start=>parseInt(hex.slice(start,start+2),16)/255);
export function mountScene(container,scene,api){
 const canvas=document.createElement('canvas');canvas.className='webgl-scene';canvas.setAttribute('aria-hidden','true');let gl;
 try{gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});}catch{}if(!gl){container.classList.add('webgl-fallback');return;}
 const highp=(gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision||0)>0;
 const receiverPlane=!!gl.getExtension('OES_standard_derivatives');
 const precision=`precision ${highp?'highp':'mediump'} float;\n`;
 const shader=(type,source)=>{const s=gl.createShader(type),derivatives=type===gl.FRAGMENT_SHADER&&receiverPlane?'#extension GL_OES_standard_derivatives : enable\n#define RECEIVER_PLANE_DEPTH\n':'';gl.shaderSource(s,derivatives+precision+source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;};
 const linkProgram=(vertex,fragment)=>{const p=gl.createProgram(),v=shader(gl.VERTEX_SHADER,vertex),f=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){gl.deleteProgram(p);throw Error('Scene program could not link.');}return p;};
 let program;try{program=linkProgram(VERTEX,FRAGMENT);}catch(error){console.warn('Trikzik 3D renderer unavailable:',error.message);container.classList.add('webgl-fallback');return;}
 container.append(canvas);container.classList.add('webgl-ready');const fallback=container.querySelector('.scene-world');fallback.setAttribute('aria-hidden','true');fallback.querySelectorAll('a').forEach(a=>a.tabIndex=-1);
 gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(.71,.76,.68,1);
 const locations={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),model:gl.getUniformLocation(program,'uModel'),normalMatrix:gl.getUniformLocation(program,'uNormal'),view:gl.getUniformLocation(program,'uView'),projection:gl.getUniformLocation(program,'uProjection'),color:gl.getUniformLocation(program,'uColor'),eye:gl.getUniformLocation(program,'uEye'),lightMatrix:gl.getUniformLocation(program,'uLightMatrix'),sun:gl.getUniformLocation(program,'uSun'),shadowMap:gl.getUniformLocation(program,'uShadowMap'),shadowEnabled:gl.getUniformLocation(program,'uShadowEnabled'),shadowTexel:gl.getUniformLocation(program,'uShadowTexel'),shadowBias:gl.getUniformLocation(program,'uShadowBias'),depthDecode:gl.getUniformLocation(program,'uDepthDecode')};
 const buffers={};for(const type of['box','cylinder','sphere']){const data=mesh(type),p=gl.createBuffer(),n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,data.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,data.normals,gl.STATIC_DRAW);buffers[type]={p,n,count:data.vertices.length/3};}
 const objects=scene.objects.map(o=>{const matrix=modelMatrix(o);return{...o,matrix,normal:normalMatrix(matrix),rgb:color(o.color)};});
 // The workbench admits low sun through its left window; the hall admits it
 // through its skylight. Both are directional lights, fixed with the geometry.
 const hasSideWindow=objects.some(o=>o.color==='#f4edc7'&&(o.size?.[0]||1)<.1);
 const sun=normal(scene.sun||(hasSideWindow?[-1,.28,-.45]:[-.65,1,.4]));
 const sunlight=lightMatrix(objects,sun),shadowSize=Math.min(1024,gl.getParameter(gl.MAX_TEXTURE_SIZE));
 let shadowProgram=null,shadowFramebuffer=null,shadowDepth=null,shadowReady=false,shadowDrawMs=0;
 const shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 try{
  shadowProgram=linkProgram(SHADOW_VERTEX,highp?SHADOW_PACKED:SHADOW_RED);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shadowSize,shadowSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  shadowFramebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);
  shadowDepth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,shadowDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,shadowSize,shadowSize);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,shadowDepth);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer unavailable.');
  const started=performance.now();gl.useProgram(shadowProgram);gl.viewport(0,0,shadowSize,shadowSize);gl.disable(gl.DITHER);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const position=gl.getAttribLocation(shadowProgram,'aPosition'),model=gl.getUniformLocation(shadowProgram,'uModel'),light=gl.getUniformLocation(shadowProgram,'uLightMatrix');gl.uniformMatrix4fv(light,false,sunlight);
  for(const o of objects){if(!castsShadow(o))continue;const b=buffers[o.type||'box'];gl.bindBuffer(gl.ARRAY_BUFFER,b.p);gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(model,false,o.matrix);gl.drawArrays(gl.TRIANGLES,0,b.count);}
  shadowDrawMs=performance.now()-started;shadowReady=true;
 }catch(error){
  console.warn('Trikzik directional shadows unavailable:',error.message);
  // A complete white 1px texture keeps the main pass valid even on devices
  // without a usable framebuffer; meshes and navigation remain available.
  gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
 }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);gl.enable(gl.DITHER);gl.clearColor(.76,.79,.70,1);gl.useProgram(program);}
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(locations.shadowMap,0);gl.uniform1f(locations.shadowEnabled,shadowReady?1:0);gl.uniform1f(locations.shadowTexel,1/shadowSize);gl.uniform1f(locations.shadowBias,highp?.00032:.006);gl.uniform4fv(locations.depthDecode,highp?[1,1/255,1/65025,1/16581375]:[1,0,0,0]);gl.uniformMatrix4fv(locations.lightMatrix,false,sunlight);gl.uniform3fv(locations.sun,sun);
 const links=scene.hotspots.map(h=>{const link=document.createElement('a');link.href=h.href||'#';link.className='scene-hotspot';link.dataset.pick=h.id;link.setAttribute('aria-label',h.label);link.innerHTML=`<span class="hotspot-dot" aria-hidden="true"></span><span class="hotspot-label">${h.label.replace(/^Enter /,'')}</span>`;link.addEventListener('focus',()=>{if(h.view&&container.dataset.view!==h.view)setCamera(h.view);});if(h.href?.startsWith('#/'))link.addEventListener('click',event=>{if(container.clientWidth>=700||event.detail===0)return;if(!link.classList.contains('is-identified')){event.preventDefault();container.querySelectorAll('.scene-hotspot').forEach(a=>a.classList.remove('is-identified'));link.classList.add('is-identified');api.announce(h.label+'. Tap the doorway again to enter. The room index opens rooms directly.');}});container.append(link);return{...h,link};});
 let eye=[...scene.camera.eye],target=[...scene.camera.target],view='center',frame=0,disposed=false,stats={objects:objects.length,triangles:objects.reduce((n,o)=>n+buffers[o.type||'box'].count/3,0),draws:0,shadowMap:shadowReady?shadowSize:0,shadowPasses:shadowReady?1:0,shadowEncoding:highp?'rgba-packed':'red-depth',shadowReceiverPlane:receiverPlane,shadowDrawMs:Number(shadowDrawMs.toFixed(3)),lastDrawMs:0,maxDrawMs:0,drawTiming:'CPU command submission plus hotspot layout; not GPU time or FPS'};
 function project(p,transform){const v=[...p,1],q=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)q[r]+=transform[k*4+r]*v[k];return[(q[0]/q[3]+1)*container.clientWidth/2,(1-q[1]/q[3])*container.clientHeight/2,q[3]];}
 function draw(){if(disposed)return;const started=performance.now(),w=container.clientWidth,h=container.clientHeight,ratio=Math.min(devicePixelRatio||1,1.5);if(!w||!h)return;if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const projection=perspective(w/h),camera=lookAt(eye,target);gl.uniformMatrix4fv(locations.projection,false,projection);gl.uniformMatrix4fv(locations.view,false,camera);gl.uniform3fv(locations.eye,eye);for(const o of objects){const b=buffers[o.type||'box'];gl.bindBuffer(gl.ARRAY_BUFFER,b.p);gl.enableVertexAttribArray(locations.position);gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,b.n);gl.enableVertexAttribArray(locations.normal);gl.vertexAttribPointer(locations.normal,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(locations.model,false,o.matrix);gl.uniformMatrix3fv(locations.normalMatrix,false,o.normal);gl.uniform3fv(locations.color,o.rgb);gl.drawArrays(gl.TRIANGLES,0,b.count);}const transform=multiply(projection,camera);for(const h of links){const[x,y,z]=project(h.position,transform),visible=z>0&&x>20&&x<w-20&&y>20&&y<hh();h.link.style.left=x+'px';h.link.style.top=y+'px';h.link.hidden=!visible;}stats.draws++;stats.lastDrawMs=Number((performance.now()-started).toFixed(3));stats.maxDrawMs=Math.max(stats.maxDrawMs,stats.lastDrawMs);canvas.dataset.sceneStats=JSON.stringify(stats);function hh(){return container.clientHeight-30;}}
 function setCamera(next){view=next;container.dataset.view=next;container.parentElement.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===next)));const mobile=container.clientWidth<700;const cameras=scene.cameras||{},config=cameras[(mobile?'mobile-':'')+next]||cameras[next]||scene.camera;const fromEye=[...eye],fromTarget=[...target];cancelAnimationFrame(frame);if(api.paused()){eye=[...config.eye];target=[...config.target];draw();return;}const begin=performance.now();function step(now){if(disposed)return;const t=api.paused()?1:Math.min(1,(now-begin)/550),ease=t*t*(3-2*t);eye=fromEye.map((v,i)=>v+(config.eye[i]-v)*ease);target=fromTarget.map((v,i)=>v+(config.target[i]-v)*ease);draw();if(t<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);}
 container.parentElement.querySelectorAll('button[data-view]').forEach(button=>button.onclick=()=>setCamera(button.dataset.view));
 const resize=new ResizeObserver(()=>{const cameras=scene.cameras||{},config=cameras[(container.clientWidth<700?'mobile-':'')+view]||cameras[view]||scene.camera;eye=[...config.eye];target=[...config.target];draw();});resize.observe(container);draw();
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();container.classList.remove('webgl-ready');fallback.removeAttribute('aria-hidden');fallback.querySelectorAll('a').forEach(a=>a.removeAttribute('tabindex'));links.forEach(h=>h.link.hidden=true);api.announce('The 3D view is unavailable. The illustrated room and room index remain usable.');});
 api.cleanup(()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();Object.values(buffers).forEach(b=>{gl.deleteBuffer(b.p);gl.deleteBuffer(b.n);});gl.deleteTexture(shadowTexture);if(shadowDepth)gl.deleteRenderbuffer(shadowDepth);if(shadowFramebuffer)gl.deleteFramebuffer(shadowFramebuffer);if(shadowProgram)gl.deleteProgram(shadowProgram);gl.deleteProgram(program);});
 return{links,setCamera,draw,stats};
}
