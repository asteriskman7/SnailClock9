'use strict';

function getTimeString(t) {
  let [h,m] = t.toLocaleTimeString().split` `[0].split`:`;
  if (h < 10) {h = '0' + h;}
  let baseString = `${h}:${m}`;
  return baseString;
}


function textAtPointAndAngle(context, x, y, angle, text) {
  context.save();
  context.translate(x, y);
  context.rotate(-angle);
  context.fillText(text, 0, 0);
  context.restore();
}

//build up our clock font
let digitGrid = [];
function addDigit(s) {
  let a = s.split`\n`;
  a.shift();
  a = a.map(e => {
    return e.split``.map(d => d|0);
  });
  digitGrid.push(a);
}
function addAllDigits() {
addDigit(`
01110
10001
10001
10001
10001
01110`);

addDigit(`
00100
11100
00100
00100
00100
11111`);

addDigit(`
01110
10001
00010
00100
01000
11111`);

addDigit(`
01110
10001
00010
00010
10001
01110`);

addDigit(`
00010
00110
01010
10010
11111
00010`);

addDigit(`
11111
10000
11110
00001
10001
01110`);

addDigit(`
01110
10000
11110
10001
10001
01110`);

addDigit(`
11111
00001
00010
00010
00100
00100`);

addDigit(`
01110
10001
01110
10001
10001
01110`);

addDigit(`
01110
10001
10001
01111
00001
01110`);

addDigit(`
00000
00100
00000
00000
00100
00000`);
}
addAllDigits();



var camera, scene, renderer;
var geometry, material, mesh;

var snailTexture;

function createCube(x, y, z, s) {
  let g = new THREE.BoxGeometry(s, s, s);
  let mat = new THREE.MeshNormalMaterial();
  let mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x,y,z);
  scene.add(mesh);
  return mesh;
}

function createBox(x, y, z, wx, hy, dz) {
  let g = new THREE.BoxGeometry(wx, hy, dz);

  let mat = new THREE.MeshPhongMaterial({
    color: 0X51504e,
    specular: 0x050505,
    shininess: 20
  });
  let mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

let color = 0;
function createSphere(x, y, z, r) {
  let g = new THREE.SphereGeometry(r, 16, 16);
  let mat = new THREE.MeshPhongMaterial({
    map: snailTexture,
    specular: 0x050505,
    shininess: 50
  });


  let mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

function createSnail(quad, x, y, z) {
  let shell = createSphere(x, y, z, 0.1);
  objList.push(shell);
  let body;
  let bheight = 0.06;
  switch (quad) {
    case 0:
      body = createBox(x - 0.05, y, z, bheight, 0.1, 0.3);
      break;
    case 1:
      body = createBox(x - 0.05, y, z, bheight, 0.3, 0.1);
      break;
    case 2:
      body = createBox(x - 0.05, y, z, bheight, 0.1, 0.3);
      break;
    case 3:
      body = createBox(x - 0.05, y, z, bheight, 0.3, 0.1);
      break;
  }

  objList.push(body);
}

let plight;
let textureCount;
let bgTexture;
function textureFinish() {
  textureCount --;
  if (textureCount === 0) {
    draw();
  }
}

function init() {
  snailTexture = new THREE.TextureLoader().load('./shell32.png', textureFinish);
  bgTexture = new THREE.TextureLoader().load('./bg600x200.png', textureFinish);
  textureCount = 2;

  //camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.01, 10 );
  //camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.01, 100);
  camera = new THREE.OrthographicCamera(-6, 6, 2, -2, 0.01, 100);

  scene = new THREE.Scene();
  scene.background = bgTexture;

  let alight = new THREE.AmbientLight(0xFFFFFF, 0.4);
  scene.add(alight);

  plight = new THREE.PointLight(0xffffff, 2, 100);
  plight.position.set(2,2,2);
  scene.add(plight);

  //var axesHelper = new THREE.AxesHelper( 1 );
  //scene.add( axesHelper );


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  //renderer.setSize( window.innerWidth, window.innerHeight );
  //renderer.setSize( 600, 600);
  renderer.setSize( 1200, 400);
  document.body.appendChild( renderer.domElement );
}

let objList = [];
function updateSpheres(curDate, quad) {
  objList.forEach( s => {
    scene.remove(s);
  });
  let quadBits = [];
  for (let drawQuad = 0; drawQuad < 4; drawQuad++) {
    let quadTime = new Date();
    quadTime.setTime(curDate.getTime() + drawQuad * 1000 * 60);
    let timeString = getTimeString(quadTime);
    let bitGrid = [];
    timeString.split``.forEach(d => {
      let digitInfo;
      if (d !== ':') {
        digitInfo = digitGrid[d];
      } else {
        digitInfo = digitGrid[10];
      }
      for (let x = 0; x < 5; x++) {
        let row = [];
        for (let y = 0; y < 6; y++) {
          let bit = digitInfo[y][x];
          row.push(bit);
        }
        bitGrid.push(row);
      }
    });
    quadBits.push(bitGrid);
  }
  for (let drawQuad = 0; drawQuad < 4; drawQuad++) {
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 6; y++) {
        let bit = quadBits[drawQuad][x][y];
        if (bit) {
          let s;
          let realQuad = (quad + drawQuad) % 4;
          //zcoord can be any x such that quadBits[drawQuad+1][x][y] === 1
          let zCoord = 0;
          let zCoordList = [];

          for (let ztest = 0; ztest < 25; ztest++) {
            if (quadBits[(drawQuad+1)%4][ztest][y]) {
              zCoordList.push(ztest);
            }
          }

          zCoord = zCoordList[Math.floor(zCoordList.length * Math.random())] * 0.2;

          switch (realQuad) {
            case 0:
              s = createSnail(realQuad, (5 - y) * 0.2, x * 0.2, zCoord);
              break;
            case 1:
              s = createSnail(realQuad, (5 - y) * 0.2, -zCoord, x * 0.2);
              break;
            case 2:
              s = createSnail(realQuad, (5 - y) * 0.2, -x * 0.2, -zCoord);
              break;
            case 3:
              s = createSnail(realQuad, (5 - y) * 0.2, zCoord, -x * 0.2);
              break;
          }
        }
      }
    }
  }
}


let cangle = 0;

let lastMinute;

function draw() {
  let newMinute = false;

  let curDate = new Date();
  let curMinutePercent = (curDate.getSeconds() + curDate.getMilliseconds() / 1000) / 60;
  let quad = curDate.getMinutes() % 4;

  if (lastMinute !== curDate.getMinutes()) {
    updateSpheres(curDate, quad);
    newMinute = lastMinute !== undefined;
    lastMinute = curDate.getMinutes();

  }

  cangle = -((quad * 0.25 + curMinutePercent/4) * Math.PI * 2 + Math.PI);
  let cDist = 8;
  let wiggleAmp = 0.4 * Math.pow(Math.sin(curMinutePercent * Math.PI),2);

  //camera.position.x = Math.cos(cangle);
  camera.position.y = cDist * Math.sin(cangle);
  camera.position.z = cDist * Math.cos(cangle);
  camera.position.x = 0.5;
  camera.position.x = 0.5 + wiggleAmp * Math.cos(curMinutePercent * Math.PI * 128);

  if (false) {
    camera.position.x = 3;
    camera.position.y = 0;
    camera.position.z = 0;
  }


  camera.lookAt(new THREE.Vector3(0.5,0,0));
  camera.up = new THREE.Vector3(1,0,0);
  plight.position.y = cDist * Math.sin(cangle + Math.PI/4);
  plight.position.z = cDist * Math.cos(cangle + Math.PI/4);
  plight.position.x = 0;

  renderer.render( scene, camera );

  if (newMinute) {
    setTimeout(draw, 1000);
  } else {
    requestAnimationFrame(draw);
  }
}

init();
