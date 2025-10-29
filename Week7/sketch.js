import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, clock;
let container, levelText, speakText, startMicBtn;
let tankMesh, waterMesh, surfaceMesh;
let analyser, audioCtx, micStream;
let speaking = false; let speakingAccum = 0; let lastSecTs = 0;

// Water model: start with 10 liters = 10000 ml
const TOTAL_ML_START = 10000;
let remainingMl = TOTAL_ML_START;
const tankSize = { w: 30, d: 30, h: 60 }; // cm approximation

window.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('three-container');
  levelText = document.getElementById('levelText');
  speakText = document.getElementById('speakText');
  startMicBtn = document.getElementById('startMic');
  startMicBtn.addEventListener('click', enableMic);
  updateLevelText();
  initThree();
  animate();
});

function initThree() {
  scene = new THREE.Scene();
  const w = container.clientWidth, h = container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 1000);
  camera.position.set(70, 50, 90);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 2, 1); scene.add(dir);

  // Tank: transparent square tube
  const tankGeo = new THREE.BoxGeometry(tankSize.w+2, tankSize.h+2, tankSize.d+2);
  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0x888888, metalness: 0, roughness: 0.2,
    transmission: 0.2, transparent: true, opacity: 0.25, clearcoat: 0.4
  });
  tankMesh = new THREE.Mesh(tankGeo, tankMat);
  tankMesh.position.y = (tankSize.h/2);
  scene.add(tankMesh);

  // Water volume (box) - will scale Y to level
  const waterGeo = new THREE.BoxGeometry(tankSize.w, 1, tankSize.d);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x3aa9ff, metalness: 0.05, roughness: 0.15, transmission: 0.7,
    thickness: 2.0, transparent: true, opacity: 0.95, clearcoat: 0.5
  });
  waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0.5;
  scene.add(waterMesh);

  // Surface plane with simple splash shader
  const surfGeo = new THREE.PlaneGeometry(tankSize.w, tankSize.d, 64, 64);
  const surfMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uColor: { value: new THREE.Color(0xffea00) }
    },
    vertexShader: `
      uniform float uTime; uniform float uAmp;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float w = sin((p.x*0.35 + uTime*2.0)) * cos((p.y*0.35 - uTime*1.7));
        p.z += w * (0.4 + uAmp*2.2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv; uniform vec3 uColor;
      void main(){
        gl_FragColor = vec4(uColor, 0.9);
      }
    `,
    transparent: true
  });
  surfaceMesh = new THREE.Mesh(surfGeo, surfMat);
  surfaceMesh.rotation.x = -Math.PI/2;
  surfaceMesh.position.y = waterMesh.position.y + 0.51;
  scene.add(surfaceMesh);

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
}

function onResize(){
  const w = container.clientWidth, h = container.clientHeight;
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

async function enableMic(){
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    startMicBtn.disabled = true; startMicBtn.textContent = 'Mic Enabled';
  } catch (e) {
    console.error('Mic error', e);
    alert('Microphone permission required.');
  }
}

function getRMS(){
  if (!analyser) return 0;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);
  // RMS of centered waveform
  let sum = 0; for (let i=0;i<buf.length;i++){ const v = (buf[i]-128)/128; sum += v*v; }
  return Math.sqrt(sum / buf.length);
}

function updateWaterLevel(dt){
  // Height mapping: 10000 ml -> full tank height (tankSize.h)
  const frac = Math.max(0, remainingMl) / TOTAL_ML_START;
  const height = frac * tankSize.h;
  waterMesh.scale.y = Math.max(0.001, height);
  waterMesh.position.y = height * 0.5;
  surfaceMesh.position.y = height + 0.5;
}

function updateLevelText(){
  levelText.textContent = `Water: ${(remainingMl/1000).toFixed(3)} L`;
}

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();

  // voice detection per second
  const rms = getRMS();
  const speakingNow = rms > 0.04; // threshold
  const now = performance.now();
  if (speakingNow) {
    speakingAccum += dt; // seconds of speaking in this window
  }
  if (lastSecTs === 0) lastSecTs = now;
  if (now - lastSecTs >= 1000) {
    if (speakingAccum >= 0.2 && remainingMl > 0) { // spoke at least 0.2s in the last second
      remainingMl = Math.max(0, remainingMl - 1); // drain 1 ml
      updateLevelText();
    }
    speakingAccum = 0; lastSecTs = now;
  }
  speakText.style.opacity = speakingNow ? '1' : '0.5';

  // splash amplitude reacts to RMS
  if (surfaceMesh && surfaceMesh.material && surfaceMesh.material.uniforms) {
    const u = surfaceMesh.material.uniforms;
    u.uTime.value += dt;
    // decay + add on RMS
    u.uAmp.value = Math.max(0, u.uAmp.value * Math.pow(0.98, (dt*60)) + rms * 0.5);
  }

  updateWaterLevel(dt);
  renderer.render(scene, camera);
}


