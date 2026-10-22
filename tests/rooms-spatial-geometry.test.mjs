import test from 'node:test';
import assert from 'node:assert/strict';
import {makeHall,makeWorkbench} from '../rooms/spatial-models.js';

// Sample physical occupancy, rather than checking how the model builds its walls.
// Undo the renderer's Euler rotations before testing a point against a box.
function containsPoint(box,point) {
  if(box.type!=='box')return false;
  let [x,y,z]=point.map((n,i)=>n-box.position[i]);
  for(let axis=0;axis<3;axis++){
    const a=box.rotation?.[axis]||0,c=Math.cos(a),s=Math.sin(a);
    if(axis===0)[y,z]=[c*y+s*z,-s*y+c*z];
    if(axis===1)[x,z]=[c*x-s*z,s*x+c*z];
    if(axis===2)[x,y]=[c*x+s*y,-s*x+c*y];
  }
  return [x,y,z].every((n,i)=>Math.abs(n)<box.size[i]/2-1e-6);
}
const occupied=(scene,point)=>scene.objects.some(box=>containsPoint(box,point));

test('Hall doorways pass through real wall openings with solid walls around them',()=>{
  const expected=['workbench','museum','library','observatory','specimens','soft','mirrors','traffic','conservatory','counterweight','portal'];
  for(const visited of [['hall'],['hall',...expected]]){
    const scene=makeHall({visited});
    assert.deepEqual(scene.hotspots.map(h=>h.id),expected);
    for(const door of scene.hotspots){
      assert.equal(door.href,'#/'+door.id);
      const side=Math.abs(door.position[0])>6;
      // Three heights, three lateral points and three depths cover each opening.
      for(const height of [.7,2.2,3.4])for(const across of [-.6,0,.6])for(const depth of [-.1,0,.1]){
        const point=side?[Math.sign(door.position[0])*7.1+depth,height,door.position[2]+across]:[door.position[0]+across,height,-7.53+depth];
        assert.equal(occupied(scene,point),false,`${door.id} has a solid obstruction at ${point}`);
      }
      const lintel=side?[Math.sign(door.position[0])*7.1,5,door.position[2]]:[door.position[0],5,-7.53];
      assert.equal(occupied(scene,lintel),true,`${door.id} needs a solid lintel above the opening`);
    }
    for(const pier of [[-7.1,2,2.975],[7.1,2,2.975],[-2.25,2,-7.53],[2.25,2,-7.53]]){
      assert.equal(occupied(scene,pier),true,`surrounding wall missing at ${pier}`);
    }
  }
});

test('Workbench window has open panes through the wall and substantial surrounding masonry',()=>{
  const scene=makeWorkbench();
  for(const y of [2.6,4.6])for(const z of [-4.25,-1.75])for(const x of [-7.2,-7.1,-7]){
    assert.equal(occupied(scene,[x,y,z]),false,`window pane is blocked by a wall at ${[x,y,z]}`);
  }
  for(const wall of [[-7.1,1,-3],[-7.1,6,-3],[-7.1,3,-6.2],[-7.1,3,0]]){
    assert.equal(occupied(scene,wall),true,`window surrounding wall missing at ${wall}`);
  }
  assert.equal(occupied(scene,[-6.91,3.8,-3]),true,'window must retain its physical mullion');
});
