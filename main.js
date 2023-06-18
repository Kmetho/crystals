import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

scene.fog = new THREE.FogExp2(0xffffff, 0.05);

// setting controls

const controls = new OrbitControls(camera, renderer.domElement);

controls.listenToKeyEvents(window); // optional

//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;

controls.screenSpacePanning = false;

controls.minDistance = 16;
controls.maxDistance = 50;
controls.zoomSpeed = -1;

controls.maxPolarAngle = Math.PI / 2;

// light
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);

// // helpers
// const lightHelper = new THREE.PointLightHelper(pointLight);
// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper);

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

// core

const core = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x000000 })
);
scene.add(core);

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
    color: 0x1e00c4,
    emissive: 0x5700e7,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),

  new THREE.MeshStandardMaterial({
    color: 0xe7d29a,
    emissive: 0x0b0b0b,
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
    color: 0xb4895a,
    emissive: 0x684f31,
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
    emissive: 0x001be7,
    roughness: 0,
    metalness: 1,
    flatShading: true,
    vertexColors: true,
    fog: true,
  }),
];

materials.forEach((element) => {
  element.envMap = cubeMap;
  element.envMapIntensity = 1;
});

let crystals = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
let mixers = [];
let loader = new GLTFLoader();

crystals.forEach((element, index) => {
  let material = materials[index];
  loader.load(
    "/action/" + element + ".glb",
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

// clouds
loader.load(
  "/cloud/cloud.glb",
  function (gltf) {
    const cloud = gltf.scene;
    scene.add(cloud);
  },
  undefined,
  function (error) {
    console.log(error);
  }
);

// loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixers.forEach((mixer) => {
    mixer && mixer.update(delta);
  });

  controls.update();

  renderer.render(scene, camera);
}

animate();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
