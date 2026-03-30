import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(50);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,
    0.4,
    0.95,
  ),
);
composer.addPass(new OutputPass());

scene.fog = new THREE.FogExp2(0xffffff, 0.02);

const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.screenSpacePanning = false;
controls.minDistance = 16;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(pointLight, ambientLight);

const bg = new THREE.TextureLoader().load("/images/bg.png");
scene.background = bg;

const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeMap = cubeTextureLoader.load([
  "/images/px.png",
  "/images/nx.png",
  "/images/py.png",
  "/images/ny.png",
  "/images/pz.png",
  "/images/nz.png",
]);

const stars = [];
const starHomePositions = [];
const starGeometry = new THREE.SphereGeometry(0.2, 6, 6);
const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
starMaterial.envMap = cubeMap;
starMaterial.envMapIntensity = 10;

Array(400)
  .fill()
  .forEach(() => {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    const [x, y, z] = Array(3)
      .fill()
      .map(() => THREE.MathUtils.randFloatSpread(100));
    star.position.set(x, y, z);
    scene.add(star);
    stars.push(star);
    starHomePositions.push(star.position.clone());
  });

const mouseWorld = new THREE.Vector3();

let materials = [
  new THREE.MeshStandardMaterial({
    color: 0x4a4558,
    emissive: 0x001099,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x3a4a3e,
    emissive: 0x154a35,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x5a4a2a,
    emissive: 0x6a5a80,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x1a5a5b,
    emissive: 0x4a4a4a,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x0e0080,
    emissive: 0x0d053a,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x4a2a3a,
    emissive: 0x8a0050,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x5a4a70,
    emissive: 0x4a0080,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x2a4a5a,
    emissive: 0x3a7a90,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
];

materials.forEach((element) => {
  element.envMap = cubeMap;
  element.envMapIntensity = 0.8;
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const crystalMeshes = [];
const originalEmissives = new Map();
let hoveredObject = null;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
});

let audioCtx = null;
const crystalNotes = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25,
];
const crystalNoteMap = new Map();

function playEtherealTone(frequency) {
  if (!audioCtx) audioCtx = new AudioContext();
  const now = audioCtx.currentTime;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

  const osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(frequency, now);

  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(frequency, now);
  osc2.detune.setValueAtTime(7, now);

  const osc3 = audioCtx.createOscillator();
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(frequency * 2, now);
  const octaveGain = audioCtx.createGain();
  octaveGain.gain.setValueAtTime(0.06, now);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  osc3.connect(octaveGain);
  octaveGain.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc1.stop(now + 2.0);
  osc2.stop(now + 2.0);
  osc3.stop(now + 2.0);
}

const activeHalos = [];

function spawnHalo(crystal) {
  const emissiveColor = originalEmissives.get(crystal);
  const glowGeo = new THREE.SphereGeometry(3, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: emissiveColor,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const halo = new THREE.Mesh(glowGeo, glowMat);
  const worldPos = new THREE.Vector3();
  crystal.getWorldPosition(worldPos);
  halo.position.copy(worldPos);

  scene.add(halo);
  activeHalos.push({ mesh: halo, age: 0 });
}

function triggerCrystal(index) {
  playEtherealTone(crystalNotes[index]);
  const mesh = crystalMeshes.find((m) => crystalNoteMap.get(m) === index);
  if (mesh) spawnHalo(mesh);
}

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(crystalMeshes);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const noteIndex = crystalNoteMap.get(hit);
    if (noteIndex !== undefined) triggerCrystal(noteIndex);
  }
});

const keyMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 };
window.addEventListener("keydown", (event) => {
  const index = keyMap[event.key];
  if (index !== undefined) triggerCrystal(index);
});

let crystals = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
let mixers = [];
let loader = new GLTFLoader();

crystals.forEach((element, index) => {
  let material = materials[index];
  loader.load(
    "/glb/" + element + ".glb",
    function (gltf) {
      gltf.scene.traverse(function (node) {
        if (node.isMesh) {
          node.material = material;
          crystalMeshes.push(node);
          originalEmissives.set(node, material.emissive.clone());
          crystalNoteMap.set(node, index);
        }
      });
      scene.add(gltf.scene);
      mixers[index] = new THREE.AnimationMixer(gltf.scene);
      let clips = gltf.animations;
      let clip = THREE.AnimationClip.findByName(clips, element + "-action");
      mixers[index].clipAction(clip).play();
    },
    undefined,
    function (error) {
      console.error(error);
    },
  );
});

const timer = new THREE.Timer();
function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  mixers.forEach((mixer) => {
    mixer && mixer.update(delta);
  });

  for (let i = activeHalos.length - 1; i >= 0; i--) {
    const halo = activeHalos[i];
    halo.age += delta;
    const progress = halo.age / 1.5;

    if (progress >= 1) {
      scene.remove(halo.mesh);
      halo.mesh.geometry.dispose();
      halo.mesh.material.dispose();
      activeHalos.splice(i, 1);
    } else {
      const scale = 1 + progress * 1.5;
      halo.mesh.scale.set(scale, scale, scale);
      halo.mesh.material.opacity =
        0.15 * ((1 + Math.cos(progress * Math.PI)) / 2);
    }
  }

  mouseWorld.set(mouse.x, mouse.y, 0.5).unproject(camera);
  const pushRadius = 15;
  const pushRadiusSq = pushRadius * pushRadius;

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const home = starHomePositions[i];
    const dx = star.position.x - mouseWorld.x;
    const dy = star.position.y - mouseWorld.y;
    const dz = star.position.z - mouseWorld.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < pushRadiusSq) {
      const dist = Math.sqrt(distSq);
      const strength = ((pushRadius - dist) / pushRadius) * 0.3;
      star.position.x += (dx / dist) * strength;
      star.position.y += (dy / dist) * strength;
      star.position.z += (dz / dist) * strength;
    } else {
      star.position.lerp(home, 0.02);
    }
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(crystalMeshes);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hoveredObject !== hit) {
      if (hoveredObject) {
        hoveredObject.material.emissive.copy(
          originalEmissives.get(hoveredObject),
        );
        hoveredObject.scale.set(1, 1, 1);
      }
      hoveredObject = hit;
      const boosted = originalEmissives.get(hit).clone().multiplyScalar(3);
      hit.material.emissive.copy(boosted);
      hit.scale.set(1.03, 1.03, 1.03);
      document.body.style.cursor = "pointer";
    }
  } else {
    if (hoveredObject) {
      hoveredObject.material.emissive.copy(
        originalEmissives.get(hoveredObject),
      );
      hoveredObject.scale.set(1, 1, 1);
      hoveredObject = null;
      document.body.style.cursor = "default";
    }
  }

  controls.update();
  composer.render();
}

animate();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
