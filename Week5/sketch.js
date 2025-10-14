
// Three.js + Firestore-based implementation of the deity UMAP and wish beams
import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// ----- Firebase Setup -----
const firebaseConfig = {
  apiKey: "AIzaSyAMB7p3BgqWk8uFY90S415kWAk7KDK3sGk",
  authDomain: "audreysharedminds25.firebaseapp.com",
  projectId: "audreysharedminds25",
  storageBucket: "audreysharedminds25.firebasestorage.app",
  messagingSenderId: "747240210613",
  appId: "1:747240210613:web:7a7d0b22e30d65148dbefc",
  measurementId: "G-07HRBV3H36",
  databaseURL: "https://audreysharedminds25-default-rtdb.firebaseio.com" // REQUIRED for Realtime Database!
};

// Initialize Firebase when it's ready
let db;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} else {
  console.error('Firebase not loaded yet');
}

// ----- Global State -----
let entities = [];
let umapResults = [];
let axisProj = null; // { x: number[], y: number[], z: number[] }
let embeddingsReady = false;
let deitiesGroup;
let beamsGroup;
let deityMeshes = [];
let entityIndexToMesh = new Map();
let renderer, scene, camera, controls, raycaster, mouse;
let container, tooltipEl;
let explainEl;
let minX, maxX, minY, maxY;
let userZ = 200; // user plane z
let userDot;
let wishDocIdToBeam = new Map();
let deityIndexToHalo = new Map();
let deityCounts = new Map();
let activeBeamAnimations = new Set();
let ritualRings = [];
let matchPulse = null;
let typingLastTs = 0;
let typingHalo = null;
let cameraAnim = null; // {startPos, startTarget, endPos, endTarget, t0, dur}

// ----- Initialization -----
window.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('canvas-container');
  tooltipEl = document.getElementById('tooltip');
  explainEl = document.getElementById('explain-card');
  // Disable submit until ready
  const submitBtn = document.getElementById('submitWish');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    submitBtn.style.opacity = '0.5';
  }
  
  // Check if Firebase is available
  if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded. Please check script loading order.');
    return;
  }
  
  // Initialize Firebase if not already done
  if (!db) {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return;
    }
  }
  
  initializeEntities();
  assignDomainColors();
  fetchAllEmbeddings().then(() => {
    embeddingsReady = true;
    setupThree();
    updateMap();
    wireUI();
    subscribeBeams();
    // Enable submit now that everything is ready
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      submitBtn.style.opacity = '1';
    }
    console.log('Application ready - submit button enabled');
  }).catch(error => {
    console.error('Failed to initialize application:', error);
  });
});

function wireUI() {
  // Hide power/domain slider controls
  const sliderControl = document.getElementById('powerWeight');
  if (sliderControl && sliderControl.parentElement) {
    sliderControl.parentElement.style.display = 'none';
  }
  
  document.getElementById('submitWish').addEventListener('click', onSubmitWish);
  const input = document.getElementById('wishText');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmitWish();
    }
  });

  // typing listeners for wish input
  const wishInput = document.getElementById('wishText');
  wishInput.addEventListener('input', () => {
    typingLastTs = performance.now();
    ensureTypingFocusCamera();
  });
  wishInput.addEventListener('focus', () => {
    typingLastTs = performance.now();
    ensureTypingFocusCamera();
  });
}

function handleSliderInput() {
  // Slider removed - function kept for compatibility but does nothing
}

function initializeEntities() {
  entities = [...(window.expandedEntitiesDatabase || [])];
    console.log(`Loaded ${entities.length} mythological entities`);
}

function assignDomainColors() {
    const domainColors = {
    'sea': 0x0066cc,
    'sky': 0x87cefa,
    'fire': 0xdc143c,
    'sun': 0xffd700,
    'land': 0x8b4513,
    'underworld': 0x4b0082,
    'death': 0x696969,
    'love': 0xff69b4,
    'war': 0xb22222,
    'wisdom': 0x9400d3,
    'trickster': 0x32cd32,
    'creator': 0xfffafa,
    'magic': 0xda70d6,
    'art': 0x00bfff,
    'dragon': 0xd2691e,
    'moon': 0xc8c8ff,
    'earth': 0x654321,
    'wind': 0xe6e6fa,
    'water': 0x00bfff,
    'forest': 0x228b22,
    'mountain': 0x8b8989,
    'storm': 0x696969,
    'fertility': 0xffc0cb,
    'hunting': 0xa0522d,
    'crafts': 0xff8c00,
    'justice': 0xffffff,
    'chaos': 0x4b0082,
    'order': 0xffff00,
    'transformation': 0x800080,
    'beauty': 0xffb6c1,
    'wealth': 0xffd700,
    'home': 0x8b4513,
    'destruction': 0x8b0000,
    'protection': 0x006400,
    'speed': 0xffa500,
    'longevity': 0x808080,
    'sacred': 0xffffe0,
    'freedom': 0x00bfff,
    'purity': 0xffffff,
    'mystery': 0x4b0082,
    'cosmos': 0x191970
    };

    entities.forEach((entity, idx) => {
        // Create different shades of red for each deity
        // Vary hue slightly around red (0), and vary saturation and lightness
        const seed = hash32(entity.name);
        const hueVariation = ((seed % 30) / 30 - 0.5) * 0.08; // Slight variation around pure red
        const hue = (0 + hueVariation + 1) % 1; // Keep in red range (wrapping around 1.0)
        const saturation = 0.4 + ((seed >> 8) % 40) / 100; // 0.4 to 0.8
        const lightness = 0.5 + ((seed >> 16) % 35) / 100; // 0.5 to 0.85
        
        entity.displayColor = new THREE.Color();
        entity.displayColor.setHSL(hue, saturation, lightness);
    });
}

// Helper function to clear old embedding cache if storage is full
function clearEmbeddingCache() {
  try {
    const keys = Object.keys(localStorage);
    const embeddingKeys = keys.filter(key => key.startsWith('embedding_'));
    embeddingKeys.forEach(key => localStorage.removeItem(key));
    console.log('Cleared', embeddingKeys.length, 'cached embeddings');
  } catch (error) {
    console.warn('Failed to clear embedding cache:', error.message);
  }
}

async function fetchAllEmbeddings() {
  console.log('Generating embeddings for all entities...');
  for (let entity of entities) {
    const cacheKey = `embedding_${entity.name}`;
    let cachedEmbeddings = null;
    
    // Try to get cached embeddings, but don't fail if localStorage is unavailable
    try {
      cachedEmbeddings = localStorage.getItem(cacheKey);
    } catch (error) {
      console.warn('localStorage unavailable, generating embeddings without cache:', error.message);
    }
    
    if (cachedEmbeddings) {
      try {
        const embeddings = JSON.parse(cachedEmbeddings);
        [entity.personalityEmbedding, entity.powerEmbedding, entity.domainEmbedding] = embeddings;
      } catch (error) {
        console.warn('Failed to parse cached embeddings for', entity.name, ':', error.message);
        cachedEmbeddings = null; // Force regeneration
      }
    }
    
    if (!cachedEmbeddings) {
      entity.personalityEmbedding = generateDeterministicEmbedding(entity.name + entity.personality);
      entity.powerEmbedding = generateDeterministicEmbedding(entity.name + entity.power);
      entity.domainEmbedding = generateDeterministicEmbedding(entity.name + entity.domain);
      
      // Try to cache embeddings, but don't fail if storage is full
      try {
        const embeddings = [entity.personalityEmbedding, entity.powerEmbedding, entity.domainEmbedding];
        localStorage.setItem(cacheKey, JSON.stringify(embeddings));
      } catch (error) {
        console.warn('Failed to cache embeddings for', entity.name, ':', error.message);
        // If quota exceeded, clear old cache and try once more
        if (error.name === 'QuotaExceededError') {
          console.log('Storage quota exceeded, clearing old cache...');
          clearEmbeddingCache();
          try {
            localStorage.setItem(cacheKey, JSON.stringify(embeddings));
            console.log('Successfully cached after clearing old data');
          } catch (retryError) {
            console.warn('Still unable to cache after clearing:', retryError.message);
          }
        }
        // Continue without caching - the app will still work
      }
    }
  }
  console.log('All embeddings generated!');
}

function generateDeterministicEmbedding(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const embedding = [];
  for (let i = 0; i < 768; i++) {
    const seed = (hash + i * 31) % 2147483647;
    embedding.push((seed / 2147483647) * 2 - 1);
  }
  return embedding;
}

function getBlendedEmbeddings() {
  // Concatenate power and domain embeddings; personality excluded
  // Fixed weights: 50/50 split between power and domain
  const W2 = 0.5; // power weight
  const W3 = 0.5; // domain weight
  return entities.map(entity => {
    const power = entity.powerEmbedding;
    const domain = entity.domainEmbedding;
    const concat = new Array(power.length + domain.length);
    for (let i = 0; i < power.length; i++) concat[i] = power[i] * W2;
    for (let j = 0; j < domain.length; j++) concat[power.length + j] = domain[j] * W3;
    return concat;
  });
}

// Project power and domain separately to 2D each, marry them into XYZ axes:
// X: 1D power coordinate (UMAP to 1D), Y: 1D domain coordinate (UMAP to 1D), Z: combined 1D bridge (UMAP on concatenated) for depth
function computeAxisProjections() {
  // Build separate sets
  const powerSet = entities.map(e => e.powerEmbedding);
  const domainSet = entities.map(e => e.domainEmbedding);
  const concatSet = getBlendedEmbeddings();

  // Helper to get 1D UMAP ordering/coordinate
  const oneD = (vectors) => {
    const u = new UMAP({ 
      n_neighbors: Math.min(15, entities.length - 1), 
      n_components: 1, 
      min_dist: 0.35, 
      n_epochs: 250, 
      metric: 'cosine'
    });
    u.fit(vectors);
    const emb = u.getEmbedding(); // shape N x 1
    return emb.map(row => row[0]);
  };

  const xCoord = oneD(powerSet);
  const yCoord = oneD(domainSet);
  // Depth from concatenated vector 1D
  const zCoord = oneD(concatSet);

  // Normalize each axis (0..1) then center later during placement
  const norm = (arr) => {
    let minV = Infinity, maxV = -Infinity;
    for (let v of arr) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
    const span = Math.max(1e-6, maxV - minV);
    return arr.map(v => (v - minV) / span);
  };

  const X = norm(xCoord);
  const Y = norm(yCoord);
  const Z = norm(zCoord);

  // Add tiny deterministic jitter to break ties
  for (let i = 0; i < X.length; i++) {
    const seed = hash32(entities[i].name);
    X[i] += ((seed % 97) / 97 - 0.5) * 0.01;
    Y[i] += (((seed >> 7) % 101) / 101 - 0.5) * 0.01;
    Z[i] += (((seed >> 13) % 89) / 89 - 0.5) * 0.01;
  }

  return { x: X, y: Y, z: Z };
}

function updateMap() {
  axisProj = computeAxisProjections();
  computeExtents();
  placeDeities();
}

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function computeExtents() {
  minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity; let minZ = Infinity; let maxZ = -Infinity;
  const xs = axisProj?.x || [];
  const ys = axisProj?.y || [];
  const zs = axisProj?.z || [];
  for (let i = 0; i < xs.length; i++) { minX = Math.min(minX, xs[i]); maxX = Math.max(maxX, xs[i]); }
  for (let i = 0; i < ys.length; i++) { minY = Math.min(minY, ys[i]); maxY = Math.max(maxY, ys[i]); }
  for (let i = 0; i < zs.length; i++) { minZ = Math.min(minZ, zs[i]); maxZ = Math.max(maxZ, zs[i]); }
  window.__umapExtents = { minX, maxX, minY, maxY, minZ, maxZ };
}

function placeDeities() {
  const [w, h] = [container.clientWidth, container.clientHeight];
  const margin = 50;
  const { minX, maxX, minY, maxY, minZ, maxZ } = window.__umapExtents || {};
  const spanX = Math.max(1e-6, (maxX - minX));
  const spanY = Math.max(1e-6, (maxY - minY));
  const spanZ = Math.max(1e-6, (maxZ - minZ));

  // Scene spans
  const toX = v => ((v - minX) / spanX) * (w - margin * 2) + margin - w / 2;
  const toY = v => ((v - minY) / spanY) * (h - margin * 2) + margin - h / 2;
  const depth = Math.min(w, h); // keep z proportional to viewport
  const toZ = v => ((v - minZ) / spanZ) * depth - depth / 2;

  if (!deitiesGroup || !axisProj) return;

  if (deityMeshes.length === 0) {
    for (let i = 0; i < entities.length; i++) {
      // Create a group for each deity (core + glow)
      const deityGroup = new THREE.Group();
      
      // Inner core sphere
      const sphereGeo = new THREE.SphereGeometry(5, 16, 16);
      const mat = new THREE.MeshBasicMaterial({ 
        color: entities[i].displayColor, 
        transparent: true, 
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      deityGroup.add(mesh);
      
      // Outer glow layers (multiple layers for smoother glow)
      for (let layer = 1; layer <= 3; layer++) {
        const glowSize = 5 + (layer * 2.5);
        const glowGeo = new THREE.SphereGeometry(glowSize, 16, 16);
        const glowOpacity = 0.15 / layer; // Fade out with each layer
        const glowMat = new THREE.MeshBasicMaterial({
          color: entities[i].displayColor,
          transparent: true,
          opacity: glowOpacity,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide // Render inside-out for better glow effect
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        deityGroup.add(glowMesh);
      }
      
      deityGroup.userData.entityIndex = i;
      deitiesGroup.add(deityGroup);
      deityMeshes.push(deityGroup);
      entityIndexToMesh.set(i, deityGroup);
    }
  }

  deityMeshes.forEach((mesh, i) => {
    const x = toX(axisProj.x[i]);
    const y = toY(axisProj.y[i]);
    const z = toZ(axisProj.z[i]);
    mesh.position.set(x, -y, z);
  });
}

// ----- Three.js Scene -----
function setupThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000008);

  const [w, h] = [container.clientWidth, container.clientHeight];
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 5000);
  camera.position.set(0, 0, 600);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 100;
  controls.maxDistance = 2000;

  // Groups
  deitiesGroup = new THREE.Group();
  scene.add(deitiesGroup);

  beamsGroup = new THREE.Group();
  scene.add(beamsGroup);

  // User dot
  const userGeo = new THREE.SphereGeometry(7, 16, 16);
  const userMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  userDot = new THREE.Mesh(userGeo, userMat);
  userDot.position.set(0, 0, userZ);
  scene.add(userDot);

  // Typing halo (gentle glow ring)
  const haloGeo = new THREE.RingGeometry(14, 26, 64);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  typingHalo = new THREE.Mesh(haloGeo, haloMat);
  typingHalo.rotation.x = Math.PI / 2;
  typingHalo.visible = false;
  scene.add(typingHalo);

  // Stars background
  addStars();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  window.addEventListener('resize', onResize);
  animate();
}

function addStars() {
  const starGeo = new THREE.BufferGeometry();
  const starCount = 800;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 4000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xaaaaee, size: 1.2, transparent: true, opacity: 0.8 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}

function onResize() {
  const [w, h] = [container.clientWidth, container.clientHeight];
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  // re-place to account for size changes
  if (embeddingsReady && axisProj) placeDeities();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCameraAnim();
  updateUserBreathing();
  updateRitualRings();
  updateBeamAnimations();
  updateBeamOpacities();
  updateMatchPulse();
  updateTypingGlow();
  renderer.render(scene, camera);
}

// ----- Hover Tooltip -----
function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  // Recursively check all children since deities are now groups with multiple meshes
  const intersects = raycaster.intersectObjects(deitiesGroup.children, true);
  if (intersects.length > 0) {
    // Find the parent deity group (has userData.entityIndex)
    let obj = intersects[0].object;
    while (obj && obj.userData.entityIndex === undefined) {
      obj = obj.parent;
    }
    if (obj && obj.userData.entityIndex !== undefined) {
      const idx = obj.userData.entityIndex;
      const e = entities[idx];
      showTooltip(e, event.clientX, event.clientY);
    } else {
      hideTooltip();
    }
  } else {
    hideTooltip();
  }
}

function showTooltip(entity, clientX, clientY) {
  const title = `${entity.name} (${entity.culture})`;
  tooltipEl.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">${title}</div><div style="opacity:0.9;">${entity.blurb}</div>`;
  tooltipEl.style.left = clientX + 12 + 'px';
  tooltipEl.style.top = clientY + 12 + 'px';
  tooltipEl.style.display = 'block';
}

function hideTooltip() {
  tooltipEl.style.display = 'none';
}

// ----- Wish Submission and Matching -----
function onSubmitWish() {
  console.log('Submit button clicked');
  
  if (!embeddingsReady || deityMeshes.length === 0) {
    console.warn('Still preparing the cosmos. Please wait a moment.');
    alert('Still preparing the cosmos. Please wait a moment.');
    return;
  }
  
  if (!db) {
    console.error('Database not initialized');
    alert('Database connection not ready. Please refresh the page.');
    return;
  }
  
  const input = document.getElementById('wishText');
  const text = (input.value || '').trim();
  if (!text) {
    console.log('No text entered');
    return;
  }
  
  console.log('Processing wish:', text);

  // Build concatenated wish embedding to match concatenated entity embeddings
  // Fixed 50/50 split between power and domain
  const W2 = 0.5; // power weight
  const W3 = 0.5; // domain weight
  const wishPower = generateDeterministicEmbedding(text + ' power');
  const wishDomain = generateDeterministicEmbedding(text + ' domain');
  const wishEmbedding = new Array(wishPower.length + wishDomain.length);
  for (let i = 0; i < wishPower.length; i++) wishEmbedding[i] = wishPower[i] * W2;
  for (let j = 0; j < wishDomain.length; j++) wishEmbedding[wishPower.length + j] = wishDomain[j] * W3;
  const blended = getBlendedEmbeddings();
  const match = findBestMatch(wishEmbedding, blended);
  const idx = match.idx;
  if (idx === -1) return;

  const deityMesh = entityIndexToMesh.get(idx);
  if (!deityMesh) return;

  // Visualize immediately
  orientUserToward(deityMesh.position);
  spawnRitualRings();
  const confidence = Math.max(0, Math.min(1, (match.score + 1) / 2)); // map cosine -1..1 to 0..1
  const beamSpeed = 20 * (0.6 + 0.8 * confidence); // slower overall; vary with confidence
  const beam = createCurvedBeam(userDot.position.clone(), deityMesh.position.clone(), entities[idx].displayColor, false, beamSpeed);
  beamsGroup.add(beam.object3d);
  activeBeamAnimations.add(beam);

  // Camera stays static - no movement, user maintains their view to see the full ray

  showMatchExplanation(text, entities[idx], match, { power: 0.5, domain: 0.5 });

  // Pulse highlight on matched deity
  startMatchPulse(deityMesh);

  // Ghost lines to top-2 alternatives
  drawGhostAlternatives(wishEmbedding, blended, idx);

  // Persist to Realtime Database
  console.log('🔥 Attempting to save wish to Realtime Database...', { text, matchedEntityName: entities[idx].name });
  const wishRef = db.ref('wishes').push({
    text,
    matchedEntityName: entities[idx].name,
    matchedEntityIndex: idx,
    deityXYZ: { x: deityMesh.position.x, y: deityMesh.position.y, z: deityMesh.position.z },
    userZ,
    weights: { power: W2, domain: W3 },
    createdAt: firebase.database.ServerValue.TIMESTAMP
  }, (error) => {
    if (error) {
      console.error('❌ Failed to save wish:', error);
      console.error('Error message:', error.message);
      // Keep local beam visible even if save fails; show subtle UI hint
      try {
        const msg = document.createElement('div');
        msg.textContent = `Database Error: ${error.message}. Check console & Firebase rules.`;
        msg.style.cssText = 'position:absolute; top:6px; right:6px; background:rgba(150,30,30,0.95); color:#fff; padding:8px 12px; border-radius:4px; font-size:11px; max-width:300px;';
        container.appendChild(msg);
        setTimeout(() => msg.remove(), 8000);
      } catch (_) {}
    } else {
      console.log('✅ Wish saved successfully! Key:', wishRef.key);
      input.value = '';
    }
  });
}

function findBestMatch(queryEmbedding, poolEmbeddings) {
  let bestIdx = -1;
  let bestScore = -Infinity;
  const qNorm = vectorNorm(queryEmbedding);
  for (let i = 0; i < poolEmbeddings.length; i++) {
    const s = cosineSimilarity(queryEmbedding, poolEmbeddings[i], qNorm);
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  }
  return { idx: bestIdx, score: bestScore };
}

function vectorNorm(v) {
  let sum = 0; for (let i = 0; i < v.length; i++) sum += v[i] * v[i]; return Math.sqrt(sum);
}

function cosineSimilarity(a, b, aNorm) {
  let dot = 0; let bNormSq = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; bNormSq += b[i] * b[i]; }
  const denom = (aNorm || vectorNorm(a)) * Math.sqrt(bNormSq);
  return denom === 0 ? 0 : dot / denom;
}

// ----- Beams -----
function createBeam(from, to, color) {
  const points = [from, to];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
  const line = new THREE.Line(geom, mat);
  return { line, createdAtMs: Date.now() };
}

function subscribeBeams() {
  console.log('🔥 Setting up Realtime Database listener for wishes...');
  const wishesRef = db.ref('wishes');
  
  // Listen for ALL wishes (including existing ones on page load)
  // 'child_added' fires for each existing child on initial load, then for new additions
  wishesRef.on('child_added', (snapshot) => {
    const wishId = snapshot.key;
    const data = snapshot.val();
    console.log('✨ Wish loaded/added:', { id: wishId, data });
    
    if (!data || typeof data.matchedEntityIndex !== 'number') return;
    
    if (wishDocIdToBeam.has(wishId)) return; // already rendered

    // Reconstruct beam positions from saved data
    const deityPos = new THREE.Vector3(
      (data.deityXYZ?.x != null ? data.deityXYZ.x : (data.deityXY?.x || 0)),
      (data.deityXYZ?.y != null ? data.deityXYZ.y : (data.deityXY?.y || 0)),
      (data.deityXYZ?.z != null ? data.deityXYZ.z : 0)
    );
    const from = new THREE.Vector3(0, 0, data.userZ || userZ);
    const color = entities[data.matchedEntityIndex]?.displayColor || new THREE.Color(0xffffff);
    
    // Create beam (no animation for loaded beams)
    const beam = createCurvedBeam(from, deityPos, color, true /*no anim*/);
    beamsGroup.add(beam.object3d);
    
    const createdAtMs = data.createdAt || Date.now();
    beam.createdAtMs = createdAtMs;
    beam.material = beam.object3d.children[0]?.material;
    
    // Store beam reference
    wishDocIdToBeam.set(wishId, beam);
    
    // Update deity popularity
    incrementDeityCount(data.matchedEntityIndex);
    updateDeityHalo(data.matchedEntityIndex);
  });
  
  console.log('✅ Real-time listener active. All existing and new beams will render.');
}

function updateBeamOpacities() {
  const now = Date.now();
  const halfLifeMs = 10 * 60 * 1000; // 10 minutes
  const minAlpha = 0.05; // never fully disappear
  wishDocIdToBeam.forEach(beam => {
    const age = now - (beam.createdAtMs || now);
    const t = age / halfLifeMs;
    const alpha = Math.max(minAlpha, Math.exp(-t));
    if (beam.material) beam.material.opacity = alpha;
    if (beam.object3d) {
      beam.object3d.traverse(obj => {
        if (obj.material && 'opacity' in obj.material) obj.material.opacity = alpha;
      });
    }
  });
}

// ----- User orientation/breathing -----
function orientUserToward(target) {
  const dir = new THREE.Vector3().subVectors(target, userDot.position).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  userDot.quaternion.slerp(quat, 0.9);
}

function updateUserBreathing() {
  const t = performance.now() * 0.001;
  const typingActive = (performance.now() - typingLastTs) < 900;
  const amp = typingActive ? 0.12 : 0.05; // stronger when typing
  const s = 1.0 + Math.sin(t * 2.0) * amp;
  userDot.scale.set(s, s, s);
}

// ----- Ritual rings -----
function spawnRitualRings() {
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const geo = new THREE.RingGeometry(10, 10.8, 64);
    const mat = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(userDot.position);
    mesh.rotation.x = Math.PI / 2;
    ritualRings.push({ mesh, start: performance.now(), delay: i * 120 });
    scene.add(mesh);
  }
}

function updateRitualRings() {
  const now = performance.now();
  const duration = 1800;
  ritualRings = ritualRings.filter(r => {
    const t = (now - r.start - r.delay) / duration;
    if (t < 0) return true;
    if (t >= 1) { scene.remove(r.mesh); return false; }
    const radius = 10 + t * 80;
    r.mesh.geometry.dispose();
    r.mesh.geometry = new THREE.RingGeometry(radius, radius + 0.8, 64);
    r.mesh.material.opacity = 0.8 * (1 - t);
    return true;
  });
}

// ----- Curved animated beams -----
function createCurvedBeam(from, to, color, noAnim = false, speedOverride = null) {
  const mid = from.clone().lerp(to, 0.5);
  mid.z += 40; // subtle upward arc
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const segments = 100;
  const points = curve.getPoints(segments);
  // initialize with minimal segment to avoid initial flash
  const startPoints = noAnim ? points : [points[0], points[0]];
  const geom = new THREE.BufferGeometry().setFromPoints(startPoints);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
  const line = new THREE.Line(geom, mat);
  const object3d = new THREE.Group();
  object3d.add(line);

  // animated draw-on using line dashes via shader alternative: emulate by clipping visible segment
  const anim = { object3d, curve, total: segments, visible: noAnim ? segments : 0, createdAtMs: Date.now(), speed: speedOverride };
  if (!noAnim) anim.started = performance.now();
  return anim;
}

function updateBeamAnimations() {
  const now = performance.now();
  activeBeamAnimations.forEach(anim => {
    if (anim.visible >= anim.total) { activeBeamAnimations.delete(anim); return; }
    const dt = (now - (anim.started || now)) / 1000;
    const speed = (anim.speed != null ? anim.speed : 60); // slower default
    const targetVisible = Math.min(anim.total, Math.floor(dt * speed));
    if (targetVisible > anim.visible) {
      anim.visible = targetVisible;
      const pts = anim.curve.getPoints(anim.total);
      const sub = pts.slice(0, anim.visible + 1);
      anim.object3d.children[0].geometry.dispose();
      anim.object3d.children[0].geometry = new THREE.BufferGeometry().setFromPoints(sub);
    }
  });
}

// ----- Typing glow -----
function updateTypingGlow() {
  if (!typingHalo) return;
  const active = (performance.now() - typingLastTs) < 900;
  typingHalo.visible = active;
  if (!active) return;
  typingHalo.position.copy(userDot.position);
  const t = performance.now() * 0.001;
  const base = 24;
  const scale = 1 + 0.25 * (Math.sin(t * 2.0) + 1) * 0.5;
  typingHalo.scale.set(scale, scale, 1);
  typingHalo.material.opacity = 0.35 + 0.25 * Math.sin(t * 2.0 + Math.PI / 3);
}

// ----- Camera animation -----
function animateCameraTo(endPos, endTarget, dur = 1000) {
  cameraAnim = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    endPos: endPos.clone(),
    endTarget: endTarget.clone(),
    t0: performance.now(),
    dur
  };
}

function updateCameraAnim() {
  if (!cameraAnim) return;
  const now = performance.now();
  const t = Math.min(1, (now - cameraAnim.t0) / cameraAnim.dur);
  const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; // easeInOutQuad
  camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, ease);
  controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, ease);
  if (t >= 1) cameraAnim = null;
}

function ensureTypingFocusCamera() {
  const endPos = userDot.position.clone().add(new THREE.Vector3(0, 0, 90));
  animateCameraTo(endPos, userDot.position.clone(), 700);
}

function getDeitiesCenter() {
  const center = new THREE.Vector3();
  if (!deityMeshes || deityMeshes.length === 0) return center;
  deityMeshes.forEach(m => center.add(m.position));
  center.multiplyScalar(1 / deityMeshes.length);
  return center;
}

// ----- Halos by cumulative prayers -----
function incrementDeityCount(idx) {
  deityCounts.set(idx, (deityCounts.get(idx) || 0) + 1);
}

function updateDeityHalo(idx) {
  const mesh = entityIndexToMesh.get(idx);
  if (!mesh) return;
  let halo = deityIndexToHalo.get(idx);
  if (!halo) {
    const geo = new THREE.RingGeometry(8, 10, 48);
    const mat = new THREE.MeshBasicMaterial({ color: entities[idx].displayColor, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    halo = new THREE.Mesh(geo, mat);
    halo.rotation.x = Math.PI / 2;
    mesh.add(halo);
    deityIndexToHalo.set(idx, halo);
  }
  const count = deityCounts.get(idx) || 1;
  const radius = 8 + Math.log(1 + count) * 4;
  halo.geometry.dispose();
  halo.geometry = new THREE.RingGeometry(radius, radius + 2, 48);
  halo.material.opacity = 0.25 + Math.min(0.5, Math.log(1 + count) * 0.15);
}


// ----- Explain match -----
function showMatchExplanation(wishText, entity, match, weights) {
  if (!explainEl) return;
  const topDomains = (entity.domainKeywords || []).slice(0, 3).join(', ');
  const conf = Math.round(Math.max(0, Math.min(1, (match.score + 1) / 2)) * 100);
  explainEl.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">Why ${entity.name}?</div>
    <div style="opacity:0.9;">Matched by equal weighting:</div>
    <ul style="margin:6px 0 8px 16px; padding:0;">
      <li>Power × ${weights.power.toFixed(1)}</li>
      <li>Domain × ${weights.domain.toFixed(1)}</li>
    </ul>
    <div style="opacity:0.9;">${entity.name} domains: ${topDomains}</div>
    <div style="opacity:0.9; margin-top:6px;">Confidence: ${conf}%</div>
  `;
  const screen = worldToScreen(userDot.position.clone());
  explainEl.style.left = (screen.x + 16) + 'px';
  explainEl.style.top = (screen.y - 10) + 'px';
  explainEl.style.display = 'block';
  clearTimeout(showMatchExplanation._t);
  showMatchExplanation._t = setTimeout(() => { explainEl.style.display = 'none'; }, 5000);
}

function worldToScreen(pos) {
  const vector = pos.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: (vector.x + 1) / 2 * rect.width + rect.left,
    y: (-vector.y + 1) / 2 * rect.height + rect.top
  };
}

// ----- Match pulse -----
function startMatchPulse(mesh) {
  matchPulse = { mesh, t0: performance.now(), dur: 1400 };
}

function updateMatchPulse() {
  if (!matchPulse) return;
  const now = performance.now();
  const t = (now - matchPulse.t0) / matchPulse.dur;
  if (t >= 1) { 
    matchPulse.mesh.scale.set(1, 1, 1); // Reset scale
    matchPulse = null; 
    return; 
  }
  const s = 1 + Math.sin(t * Math.PI) * 0.4;
  matchPulse.mesh.scale.set(s, s, s);
  
  // Also pulse the glow intensity
  matchPulse.mesh.traverse(child => {
    if (child.material && child !== matchPulse.mesh.children[0]) {
      const basePulse = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
      child.material.opacity = child.material.opacity * (1 + basePulse * 0.3);
    }
  });
}

// ----- Ghost alternatives -----
function drawGhostAlternatives(queryEmbedding, poolEmbeddings, bestIdx) {
  const qNorm = vectorNorm(queryEmbedding);
  const scores = poolEmbeddings.map((emb, i) => ({ i, s: cosineSimilarity(queryEmbedding, emb, qNorm) }));
  scores.sort((a, b) => b.s - a.s);
  const ghosts = scores.filter(x => x.i !== bestIdx).slice(0, 2);
  ghosts.forEach(g => {
    const target = entityIndexToMesh.get(g.i);
    if (!target) return;
    const col = entities[g.i].displayColor.clone().multiplyScalar(0.6);
    const beam = createCurvedBeam(userDot.position.clone(), target.position.clone(), col, false, 12);
    // make very faint
    beam.object3d.traverse(obj => { if (obj.material) { obj.material.opacity = 0.25; }});
    beamsGroup.add(beam.object3d);
    activeBeamAnimations.add(beam);
  });
}
