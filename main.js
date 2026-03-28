import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Post-processing imports
// EffectComposer manages the chain of passes (think of it like a pipeline)
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
// RenderPass renders the scene into the pipeline (instead of directly to screen)
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
// The bloom effect itself — makes bright things glow
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
// OutputPass handles final color space conversion (sRGB etc.)
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(50);

renderer.outputColorSpace = THREE.SRGBColorSpace;

// === POST-PROCESSING SETUP ===
// The composer replaces renderer.render() — it runs the scene through a chain of effects
const composer = new EffectComposer(renderer);

// Step 1: Render the scene (same as before, but into the pipeline)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Step 2: Bloom effect
// Arguments: resolution (Vector2), strength, radius, threshold
// - strength: how intense the glow is (start low, 0.4-1.5 is a good range)
// - radius: how far the glow spreads
// - threshold: brightness cutoff — pixels brighter than this will bloom
//   (0 = everything blooms a bit, 1 = only pure white blooms)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,  // strength — visible but not overwhelming
  0.4,  // radius
  0.95  // threshold — very high so only the brightest emissive parts glow, white bg stays clean
);
composer.addPass(bloomPass);

// Step 3: Output pass (handles sRGB color conversion at the end)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// FogExp2(color, density) — lower density = fog kicks in further away
// 0.05 was too thick, making nearby crystals hazy. 0.02 keeps distant fade but clears up close objects.
scene.fog = new THREE.FogExp2(0xffffff, 0.02);

// setting controls

const controls = new OrbitControls(camera, renderer.domElement);

controls.listenToKeyEvents(window); // optional

//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.enablePan = false;

controls.screenSpacePanning = false;

controls.minDistance = 16;
controls.maxDistance = 50;
// controls.zoomSpeed = -1;

controls.maxPolarAngle = Math.PI / 2;

// light
// PointLight has a second argument: intensity (default 1). Let's keep it strong for highlights.
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
// AmbientLight: second arg is intensity. At 1.0 it washes out metallic materials.
// Lower values let the point light create contrast and make the crystals pop.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(pointLight, ambientLight);

// bg
const bg = new THREE.TextureLoader().load("/images/bg.png");
scene.background = bg;

// cubeMap texture images
const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeMap = cubeTextureLoader.load([
  "/images/px.png",
  "/images/nx.png",
  "/images/py.png",
  "/images/ny.png",
  "/images/pz.png",
  "/images/nz.png",
]);

//stars
Array(400)
  .fill()
  .forEach(() => {
    const geometry = new THREE.SphereGeometry(0.2, 24, 24);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    material.envMap = cubeMap;
    material.envMapIntensity = 10;
    const star = new THREE.Mesh(geometry, material);
    const [x, y, z] = Array(3)
      .fill()
      .map(() => THREE.MathUtils.randFloatSpread(100));
    star.position.set(x, y, z);
    scene.add(star);
  });

// crystals
let materials = [
  new THREE.MeshStandardMaterial({
    color: 0xe7e2da,
    emissive: 0x000fe7,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0xdfd9e2,
    emissive: 0x2a7f62,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0xe7d29a,
    emissive: 0xb497d6,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0x77feff,
    emissive: 0x949494,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0x1a00e7,
    emissive: 0x000000,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0xd1b1cb,
    emissive: 0xf90093,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0xfffffd,
    emissive: 0x8a00e7,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0x9dc1e7,
    emissive: 0x69ddff,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
];

materials.forEach((element) => {
  element.envMap = cubeMap;
  // envMapIntensity controls how much the cube map reflections contribute to the surface.
  // At 1.0 with metalness=1, the reflections dominate and wash out the colors.
  // Lowering it lets the emissive and base colors come through.
  element.envMapIntensity = 0.4;
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
        }
      });
      scene.add(gltf.scene);
      mixers[index] = new THREE.AnimationMixer(gltf.scene);
      let clips = gltf.animations;
      let clip = THREE.AnimationClip.findByName(clips, element + "-action");
      mixers[index].clipAction(clip).play();
      console.log(mixers[index]);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
});

// loop
// THREE.Clock is deprecated in newer Three.js — THREE.Timer is the replacement
// Timer is more precise and doesn't auto-start, giving you more control
const timer = new THREE.Timer();
function animate() {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  mixers.forEach((mixer) => {
    mixer && mixer.update(delta);
  });

  controls.update();

  // Use the composer instead of renderer directly — this runs the bloom pipeline
  composer.render();
}

animate();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // The composer also needs to know about the new size, otherwise bloom renders at the old resolution
  composer.setSize(window.innerWidth, window.innerHeight);
});
