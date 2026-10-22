// Scene geometry only. Sizes are box extents or [radius, height, radius].
// Openings are gaps between independent wall segments, never painted-on doors.
const P = {
  plaster: '#e2dfcd', plasterLight: '#eeead9', sage: '#b7c3ae', sageLight: '#d0d8c4',
  teal: '#477b73', deepTeal: '#365e58', oak: '#b88d60', oakEdge: '#936e4c',
  floor: '#c6c8b5', seam: '#afb6a2', shadow: '#9ca891', cream: '#f4ebcf',
  metal: '#879b8a', brass: '#c4a66b', coral: '#bd795e'
};

function sceneBuilder() {
  const objects = [];
  const add = (type, position, size, color, rotation) => {
    const value = { type, position, size, color };
    if (rotation) value.rotation = rotation;
    objects.push(value);
    return value;
  };
  return {
    objects,
    box: (position, size, color, rotation) => add('box', position, size, color, rotation),
    cylinder: (position, size, color, rotation) => add('cylinder', position, size, color, rotation),
    sphere: (position, size, color, rotation) => add('sphere', position, size, color, rotation)
  };
}

function floorAndCeiling(b, { depth = 16, back = -7.5, skylight = true } = {}) {
  const center = back + depth / 2;
  b.box([0, -.13, center], [14.4, .26, depth], P.floor);
  // Restrained joints establish scale and convergence without a checkerboard.
  for (const x of [-4.65, -2.3, 0, 2.3, 4.65]) b.box([x, .006, center], [.018, .012, depth], P.seam);
  for (let z = back + 1.7; z < back + depth; z += 2.4) b.box([0, .007, z], [14, .014, .018], P.seam);
  if (skylight) {
    // Four solid ceiling panels surround a real rectangular skylight aperture.
    b.box([-5.15, 7.04, center], [3.7, .22, depth], P.sageLight);
    b.box([5.15, 7.04, center], [3.7, .22, depth], P.sageLight);
    b.box([0, 7.04, -5.7], [6.6, .22, 3.6], P.sageLight);
    b.box([0, 7.04, 6.3], [6.6, .22, 4.4], P.sageLight);
    b.box([0, 7.16, -.8], [6.4, .06, 9.7], '#f6f0d2');
    for (const x of [-3.3, 0, 3.3]) b.box([x, 6.96, -.8], [.13, .15, 10], P.teal);
    for (const z of [-5.75, -2.5, .75, 4.1]) b.box([0, 6.95, z], [6.7, .16, .13], P.teal);
  } else {
    b.box([0, 7.04, center], [14.4, .22, depth], P.sageLight);
    b.box([0, 6.87, -2.1], [14, .28, .22], '#9fab98');
  }
}

const DOORS = [
  ['workbench', 'Workbench', '#a9bda6'], ['museum', 'Museum', '#dbc4a2'],
  ['library', 'Library', '#c9b4bd'], ['observatory', 'Observatory', '#9aafbf'],
  ['specimens', 'Specimens', '#b6b6ce'], ['soft', 'Soft materials', '#dcbaa9'],
  ['mirrors', 'Mirror room', '#acc6c4'], ['traffic', 'Traffic control', '#c5bf98'],
  ['conservatory', 'Conservatory', '#a5c5a5'], ['counterweight', 'Behind the walls', '#c5b69b'],
  ['portal', 'Somewhere else', '#b7b2cb']
];

export function makeHall(state = {}) {
  const b = sceneBuilder();
  const hotspots = [];
  const visited = Array.isArray(state.visited) ? state.visited : [];
  const concern = Math.min(1, Math.max(0, (visited.length - 1) / 11));
  const doorZ = [4.65, 1.3, -2.05, -5.4];
  const doorWidth = 2.2;
  const apertureHeight = 3.85;
  floorAndCeiling(b);

  function sideWall(side) {
    const x = side * 7.1;
    // One continuous lintel; below it, only the five piers between apertures.
    b.box([x, (7 + apertureHeight) / 2, .5], [.28, 7 - apertureHeight, 16], side < 0 ? P.sage : P.plaster);
    const limits = [-7.5, ...doorZ.slice().reverse().flatMap(z => [z - doorWidth / 2, z + doorWidth / 2]), 8.5];
    for (let i = 0; i < limits.length - 1; i += 2) {
      const lo = limits[i], hi = limits[i + 1];
      if (hi <= lo) continue;
      b.box([x, apertureHeight / 2, (lo + hi) / 2], [.28, apertureHeight, hi - lo], side < 0 ? P.sage : P.plaster);
    }
    b.box([side * 6.89, 4.68, .5], [.13, .12, 15.9], '#eee8d4');
  }
  sideWall(-1);
  sideWall(1);

  // Back wall uses the same construction: three genuine gaps in the lower wall.
  b.box([0, 5.425, -7.53], [14.4, 3.15, .3], P.plasterLight);
  const backX = [-4.5, 0, 4.5];
  const ends = [-7.2, -5.6, -3.4, -1.1, 1.1, 3.4, 5.6, 7.2];
  for (let i = 0; i < ends.length; i += 2) b.box([(ends[i] + ends[i + 1]) / 2, 1.925, -7.53], [ends[i + 1] - ends[i], 3.85, .3], P.plasterLight);

  function glimpse(index, center, outward) {
    const [x, z] = center;
    const color = DOORS[index][2];
    const side = outward[0];
    if (side) {
      b.box([x + side * 1.4, -.045, z], [3, .09, 2.18], '#c6ceba');
      b.box([x + side * 3, 2.05, z], [.15, 4.1, 2.25], color);
    } else {
      b.box([x, -.045, z - 1.6], [2.18, .09, 3.4], '#c6ceba');
      b.box([x, 2.05, z - 3.2], [2.25, 4.1, .15], color);
    }
    const ox = x + outward[0] * 1.75, oz = z + outward[1] * 1.75;
    // Each aperture gives a small material clue from a physically separate space.
    if (index === 0 || index === 2 || index === 9) {
      b.box([ox, 1.05, oz], side ? [1.15, .14, 1.3] : [1.3, .14, 1.15], index === 2 ? '#886f79' : P.oak);
      b.box([ox, .53, oz], [.22, 1.06, .28], '#728776');
    } else if (index === 3 || index === 10) {
      b.sphere([ox, 2.2, oz], [.36, .36, .36], index === 3 ? '#efe8bd' : '#d6e2cb');
      b.cylinder([ox, 1.12, oz], [.035, 1.8, .035], '#748a81');
    } else if (index === 8) {
      b.cylinder([ox, .42, oz], [.38, .84, .38], '#c68e71');
      b.sphere([ox, 1.25, oz], [.57, .8, .52], '#6f9d7c');
    } else if (index === 6) {
      b.box([ox, 1.75, oz], side ? [.12, 2.5, 1.25] : [1.25, 2.5, .12], '#d3e3d5');
      b.box([ox, .35, oz], [.6, .7, .6], '#779a8f');
    } else {
      b.cylinder([ox, .65, oz], [.38, 1.3, .38], '#e3dcc7');
      b.sphere([ox, 1.65, oz], [.46, .44, .46], index === 4 ? '#9a8caf' : index === 5 ? '#d5a089' : index === 7 ? '#cba35e' : '#7b9d91');
    }
  }

  DOORS.forEach(([id, label, tint], index) => {
    const isVisited = visited.includes(id);
    const angle = .98 + (isVisited ? .26 : 0);
    if (index < 8) {
      const side = index < 4 ? -1 : 1;
      const z = doorZ[index % 4];
      const x = side * 7;
      const frameX = side * 6.91;
      for (const edge of [-1, 1]) b.box([frameX, 1.94, z + edge * 1.18], [.18, 3.88, .18], '#f0e6ce');
      b.box([frameX, 3.96, z], [.2, .22, 2.55], '#ede2c8');
      b.box([x, .055, z], [.6, .11, 2.25], '#ded7bd');
      const theta = side * angle;
      b.box([x + Math.sin(theta) * 1.03, 1.82, z - 1.1 + Math.cos(theta) * 1.03], [.11, 3.6, 2.06], isVisited ? '#608d79' : P.teal, [0, theta, 0]);
      glimpse(index, [x, z], [side, 0]);
      hotspots.push({ id, label, position: [side * 6.78, 2.35, z], href: `#/${id}` });
    } else {
      const x = backX[index - 8];
      for (const edge of [-1, 1]) b.box([x + edge * 1.18, 1.94, -7.32], [.18, 3.88, .24], '#f0e6ce');
      b.box([x, 3.96, -7.32], [2.55, .22, .24], '#ede2c8');
      b.box([x, .055, -7.4], [2.25, .11, .65], '#ded7bd');
      b.box([x - 1.1 + Math.cos(angle) * 1.03, 1.82, -7.5 - Math.sin(angle) * 1.03], [2.06, 3.6, .11], index === 10 ? '#858c9a' : P.teal, [0, angle, 0]);
      glimpse(index, [x, -7.5], [0, -1]);
      hotspots.push({ id, label, position: [x, 2.35, -7.1], href: `#/${id}` });
    }
  });

  // The Hall's concern is physical: the long balance bar and plumb bob lean.
  b.box([0, 5.53 - concern * .13, -4.8], [11.8, .08, .11], '#5b7868', [0, 0, concern * -.025]);
  b.cylinder([0, 6.26 - concern * .065, -4.8], [.035, 1.48 + concern * .13, .035], '#879b8a');
  b.sphere([0, 5.53 - concern * .13, -4.8], [.11, .11, .11], P.brass);
  const plumbAngle = concern * .12, plumbLength = 4.05;
  const bobX = 4.2 + Math.sin(plumbAngle) * plumbLength;
  const bobY = 7 - Math.cos(plumbAngle) * plumbLength;
  b.cylinder([(4.2 + bobX) / 2, (7 + bobY) / 2, 5.2], [.022, plumbLength, .022], '#698175', [0, 0, plumbAngle]);
  b.sphere([bobX, bobY, 5.2], [.18, .34, .18], P.brass);
  b.cylinder([bobX, .012, 5.2], [.34, .014, .25], P.shadow);

  // A small registration desk in the near left corner provides human scale.
  b.box([-4.25, .012, 6.45], [3.3, .018, 1.65], P.shadow);
  b.box([-4.25, 1.7, 6.45], [3.05, .18, 1.4], P.oak);
  for (const x of [-5.48, -3.02]) b.box([x, .82, 6.45], [.16, 1.64, .85], P.deepTeal);
  b.box([-4.3, 1.81, 6.35], [.9, .025, .65], P.cream, [0, -.15, 0]);
  b.box([-3.55, 1.84, 6.32], [.08, .06, .7], '#bd795e', [0, .25, 0]);

  const water = Math.min(100, Math.max(0, Number(state.hallWater) || 0));
  if (water > 0) {
    b.cylinder([.25, .022, 3.8], [.65 + water * .012, .022, .3 + water * .005], '#8dacaa');
    b.cylinder([.1, .035, 3.78], [.48 + water * .011, .008, .24 + water * .004], '#a9c4bd');
    b.box([.15, .12, 3.75], [.65, .09, .3], P.cream, [0, -.22, .07]);
    b.box([.14, .34, 3.75], [.022, .42, .27], '#ece7ce', [0, -.22, -.25]);
  }
  if (state.portalGift) {
    b.box([3.3, .014, -.9], [1.06, .018, .9], P.shadow);
    b.box([3.3, .39, -.9], [.78, .76, .67], '#c3a577', [0, -.18, 0]);
    b.box([3.3, .78, -.9], [.11, .025, .69], '#628b82', [0, -.18, 0]);
    b.box([3.3, .39, -.55], [.11, .76, .025], '#628b82', [0, -.18, 0]);
  }
  return {
    objects: b.objects, hotspots,
    camera: { eye: [0, 4.8, 12.6], target: [0, 2.65, -3.4] },
    cameras: {
      center: { eye: [0, 4.8, 12.6], target: [0, 2.65, -3.4] },
      left: { eye: [2.5, 4.5, 11.5], target: [-5.6, 2.45, -1.5] },
      right: { eye: [-2.5, 4.5, 11.5], target: [5.6, 2.45, -1.5] },
      'mobile-left': { eye: [5.3, 4.8, 14.4], target: [-7, 2.2, -.2] },
      'mobile-center': { eye: [0, 4.9, 15], target: [0, 2.4, -7.3] },
      'mobile-right': { eye: [-5.3, 4.8, 14.4], target: [7, 2.2, -.2] }
    }
  };
}

export function makeWorkbench(state = {}) {
  const b = sceneBuilder();
  floorAndCeiling(b, { skylight: false });
  b.box([0, 3.5, -7.53], [14.4, 7, .28], P.plasterLight);
  b.box([7.1, 3.5, .5], [.28, 7, 16], P.plaster);
  // The left window occupies a genuine opening, edged with deep jambs.
  b.box([-7.1, 3.5, -6.32], [.28, 7, 2.36], P.sage);
  b.box([-7.1, 3.5, 3.8], [.28, 7, 9.4], P.sage);
  b.box([-7.1, 1.05, -3], [.28, 2.1, 4.4], P.sage);
  b.box([-7.1, 6.25, -3], [.28, 1.5, 4.4], P.sage);
  b.box([-7.34, 3.8, -3], [.05, 3.4, 4.35], '#f4edc7');
  for (const z of [-5.26, -3, -.74]) b.box([-6.91, 3.8, z], [.38, 3.65, .14], P.teal);
  for (const y of [2.06, 3.8, 5.54]) b.box([-6.9, y, -3], [.42, .14, 4.65], P.teal);
  b.box([-6.72, 2.03, -3], [.85, .18, 4.8], '#ddd8bb');
  // Two restrained light patches imply the window's division on the stone.
  b.box([-3.2, .018, -1.3], [5.8, .015, 1.65], '#d8d5b6', [0, -.25, 0]);
  b.box([-2.6, .02, 1.12], [5.8, .015, 1.65], '#dcd9bd', [0, -.25, 0]);

  // A framed mechanical drawing sits well behind the apparatus.
  b.box([-1.1, 3.8, -7.28], [4.6, 2.5, .12], P.oakEdge);
  b.box([-1.1, 3.8, -7.19], [4.35, 2.25, .06], P.cream);
  b.box([-1.1, 4.55, -7.14], [3.6, .035, .02], '#b7c0aa');
  b.box([-1.1, 3.1, -7.14], [3.6, .035, .02], '#b7c0aa');
  for (let i = 0; i < 11; i++) {
    const x = -2.7 + i * .3, y = 3.74 + Math.sin(i * .7) * .32;
    b.box([x, y, -7.135], [.31, .035, .025], '#728e7e', [0, 0, Math.cos(i * .7) * .5]);
  }

  // Contact patches are thin geometry; there are no unsupported transparency tricks.
  b.box([.25, .014, 1.25], [9.1, .018, 4.02], '#abb09a');
  for (const x of [-3.8, 4.35]) for (const z of [-.2, 2.72]) {
    b.box([x, .025, z], [.54, .025, .55], '#919f89');
    b.box([x, 1.12, z], [.2, 2.24, .2], P.deepTeal);
  }
  b.box([.27, .67, -.2], [8.35, .14, .15], '#557765');
  b.box([.27, 2.16, 2.86], [8.75, .32, .14], P.oakEdge);
  b.box([.27, 2.35, 1.22], [8.9, .23, 3.6], P.oak);
  b.box([-2.5, 2.13, 2.96], [2.85, .32, .1], '#a37b53');
  b.box([-2.5, 2.15, 3.04], [.68, .055, .07], P.metal);

  // Scribble Engine: two physical pivots, two coupled arms, pen and drawing bed.
  b.box([1.7, 2.49, 1.02], [3.95, .08, 2.48], '#8b9988');
  b.box([1.7, 2.61, 1.02], [3.8, .2, 2.32], '#d6d9c6');
  b.box([1.7, 2.725, 1.28], [2.85, .024, 1.62], '#536f66');
  b.box([1.7, 2.745, 1.36], [2.45, .018, 1.32], '#eee6ca');
  const armY = 3.08;
  const pivots = [[.6, armY, .15], [2.8, armY, .15]];
  const pen = [1.65, armY, 1.57];
  function beam(a, c, width, color) {
    const dx = c[0] - a[0], dz = c[2] - a[2];
    b.box([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], [Math.hypot(dx, dz), .1, width], color, [0, -Math.atan2(dz, dx), 0]);
  }
  for (const pivot of pivots) {
    b.cylinder([pivot[0], 2.84, pivot[2]], [.28, .28, .28], P.deepTeal);
    b.cylinder([pivot[0], 3.005, pivot[2]], [.19, .06, .19], P.brass);
    beam(pivot, pen, .14, P.metal);
    b.cylinder([pivot[0], 3.15, pivot[2]], [.07, .08, .07], '#dedac0');
  }
  b.cylinder([pen[0], 3.12, pen[2]], [.13, .12, .13], '#b69a65');
  b.cylinder([pen[0], 2.97, pen[2]], [.035, .43, .035], '#bd795e');
  b.cylinder([3.38, 2.79, 1.72], [.13, .16, .13], P.teal);
  // The line on the pad is a visible mechanical sample, not a fake live game.
  for (let i = 0; i < 18; i++) {
    const t0 = i * Math.PI * 2 / 18, t1 = (i + 1) * Math.PI * 2 / 18;
    const point = t => [1.7 + Math.cos(t) * (.56 + .15 * Math.cos(3 * t)), 2.76, 1.35 + Math.sin(t) * .43];
    beam(point(t0), point(t1), .022, '#7b9480');
    // Keep the drawn line flat on paper rather than as a raised arm.
    b.objects[b.objects.length - 1].size[1] = .009;
  }

  // Loose sheet and pencil remain distinct, reachable objects beside the instrument.
  b.box([-2.3, 2.49, 1.42], [2.15, .018, 1.52], '#a49f83', [0, -.12, 0]);
  b.box([-2.34, 2.505, 1.38], [2.1, .022, 1.48], P.cream, [0, -.12, 0]);
  b.box([-2.34, 2.523, 1.38], [1.4, .006, .018], '#b8bda4', [0, -.12, 0]);
  b.box([-2.27, 2.524, 1.07], [1.4, .006, .018], '#c2c3a8', [0, -.12, 0]);
  b.cylinder([-1.2, 2.55, 1.62], [.035, 1.12, .035], P.coral, [0, 0, 1.32]);

  // Jointed task lamp, grounded to the bench, points at the drawing bed.
  b.cylinder([4.06, 2.52, -.06], [.3, .12, .3], P.deepTeal);
  b.cylinder([4.06, 2.99, -.06], [.055, .88, .055], P.metal);
  b.sphere([4.06, 3.43, -.06], [.11, .11, .11], P.brass);
  b.box([3.7, 3.78, -.06], [.08, 1.02, .08], P.metal, [0, 0, .78]);
  b.sphere([3.34, 4.14, -.06], [.1, .1, .1], P.brass);
  b.box([2.99, 4.04, -.06], [.77, .08, .08], P.metal, [0, 0, .28]);
  b.cylinder([2.62, 3.87, -.06], [.3, .3, .3], P.teal);
  b.cylinder([2.62, 3.7, -.06], [.36, .055, .36], '#e7d89d');

  // One plain stool at the near corner; no arbitrary shelf clutter.
  b.cylinder([-4.8, 1.15, 4.65], [.57, .16, .57], '#729177');
  for (const [x, z] of [[-5.15, 4.4], [-4.45, 4.4], [-4.8, 5]]) b.box([x, .55, z], [.11, 1.1, .11], P.deepTeal);
  b.cylinder([-4.8, .017, 4.65], [.65, .014, .57], P.shadow);

  return {
    objects: b.objects,
    hotspots: [
      { id: 'instrument', label: 'Use Scribble Engine', position: [1.65, 2.97, 1.1], href: '/games/scribble-engine/' },
      { id: 'draft', label: 'Open drafting sheet', position: [-2.34, 2.64, 1.38], href: '#draft-sheet' }
    ],
    camera: { eye: [.2, 5.15, 10.4], target: [0, 2.55, -.6] },
    cameras: {
      center: { eye: [.2, 5.15, 10.4], target: [0, 2.55, -.6] },
      instrument: {eye:[1.65,4.8,5.8],target:[1.65,2.75,1]},
      'mobile-instrument': {eye:[1.65,5.5,6.8],target:[1.65,2.75,1]},
      left: { eye: [-1.7, 4.9, 9.9], target: [-1.1, 2.55, -.8] },
      right: { eye: [1.9, 4.9, 9.9], target: [1.2, 2.55, -.8] },
      'mobile-left': { eye: [-1.6, 5, 11.2], target: [-2.3, 2.5, .3] },
      'mobile-center': { eye: [0, 5.7, 12.8], target: [0, 2.4, .1] },
      'mobile-right': { eye: [1.8, 5, 11.2], target: [1.7, 2.75, .65] }
    }
  };
}
