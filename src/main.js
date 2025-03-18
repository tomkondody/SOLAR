import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// ----------------------------------------------------------------
// SETUP: Scene, Camera, Renderer
// ----------------------------------------------------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// Set tone mapping and exposure for a cinematic look
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
// VERY IMPORTANT: Set output encoding to sRGB so that textures show their proper colors.
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);
const chatBox = document.getElementById("chat-box");
const chatContent = document.getElementById("chat-content");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

// ----------------------------------------------------------------
// LIGHTING
// ----------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0x404040, 2.5);
scene.add(ambientLight);

const sunlight = new THREE.PointLight(0xffffff, 3, 300);
sunlight.position.set(0, 0, 0);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
scene.add(sunlight);

// ----------------------------------------------------------------
// TEXTURE LOADING (Using high-res 4K textures)
// ----------------------------------------------------------------
const loader = new THREE.TextureLoader();
const textures = {
  sun: loader.load('./textures/sun.jpg'),
  mercury: loader.load('./textures/mercury.jpg'),
  venus: loader.load('./textures/venus.jpg'),
  earth: loader.load('./textures/earth.jpg'),
  mars: loader.load('./textures/mars.jpg'),
  jupiter: loader.load('./textures/jupiter.jpg'),
  saturn: loader.load('./textures/saturn.jpg'),
  uranus: loader.load('./textures/uranus.jpg'),
  neptune: loader.load('./textures/neptune.jpg'),
  stars: loader.load('./textures/stars.jpg'),
};

// Enable maximum anisotropic filtering and set each texture's encoding to sRGB
Object.values(textures).forEach((tex) => {
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.encoding = THREE.sRGBEncoding;
});

// ----------------------------------------------------------------
// STAR FIELD (Background)
// ----------------------------------------------------------------
const starsGeometry = new THREE.SphereGeometry(1000, 64, 64);
const starsMaterial = new THREE.MeshBasicMaterial({
  map: textures.stars,
  side: THREE.BackSide,
});
const starField = new THREE.Mesh(starsGeometry, starsMaterial);
scene.add(starField);

// ----------------------------------------------------------------
// SUN (High quality with bloom effect)
// ----------------------------------------------------------------
const sunGeometry = new THREE.SphereGeometry(5, 128, 128);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: textures.sun,
  emissive: 0xffaa33,
  emissiveIntensity: 2,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.castShadow = true;
scene.add(sun);

// ----------------------------------------------------------------
// UTILITY: Create Visible Orbit Paths
// ----------------------------------------------------------------
function createOrbitLine(radius) {
  const segments = 128;
  const orbitPoints = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    orbitPoints.push(
      new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta))
    );
  }
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.3,
    transparent: true,
  });
  return new THREE.LineLoop(orbitGeometry, orbitMaterial);
}

// Array to store orbit line objects for toggling
const orbitLines = [];

// ----------------------------------------------------------------
// PLANET DATA & CREATION
// ----------------------------------------------------------------
const planetData = [
  { name: "Mercury", size: 0.5, texture: textures.mercury, distance: 10, orbitSpeed: 0.008, rotationSpeed: 0.016 },
  { name: "Venus",   size: 0.9, texture: textures.venus,   distance: 15, orbitSpeed: 0.0064, rotationSpeed: 0.008 },
  { name: "Earth",   size: 1.0, texture: textures.earth,   distance: 20, orbitSpeed: 0.0048, rotationSpeed: 0.008 },
  { name: "Mars",    size: 0.8, texture: textures.mars,    distance: 25, orbitSpeed: 0.004,  rotationSpeed: 0.0096 },
  { name: "Jupiter", size: 2.5, texture: textures.jupiter, distance: 35, orbitSpeed: 0.0024, rotationSpeed: 0.004 },
  { name: "Saturn",  size: 2.0, texture: textures.saturn,  distance: 45, orbitSpeed: 0.002,  rotationSpeed: 0.0032 },
  { name: "Uranus",  size: 1.5, texture: textures.uranus,  distance: 55, orbitSpeed: 0.0016, rotationSpeed: 0.0024 },
  { name: "Neptune", size: 1.3, texture: textures.neptune, distance: 65, orbitSpeed: 0.0012, rotationSpeed: 0.0024 },
];

const planets = [];
planetData.forEach((data) => {
  // Use a high-detail geometry (128 segments) for each planet
  const geometry = new THREE.SphereGeometry(data.size, 128, 128);
  // Remove the emissive tint so the full color texture shows up accurately
  const material = new THREE.MeshStandardMaterial({
    map: data.texture,
    emissive: 0x000000,
    roughness: 0.5,
    metalness: 0.1,
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.x = data.distance;
  planet.orbit = {
    radius: data.distance,
    angle: Math.random() * Math.PI * 2,
    speed: data.orbitSpeed,
  };
  planet.rotationSpeed = data.rotationSpeed;
  planet.name = data.name;
  planet.castShadow = true;
  planet.receiveShadow = true;
  planets.push(planet);
  scene.add(planet);

  // Create and store the visible orbit path for this planet
  const orbitLine = createOrbitLine(data.distance);
  orbitLines.push(orbitLine);
  scene.add(orbitLine);
});
const planetChats = {
  Mercury: "I'm the fastest planet around the Sun!",
  Venus: "They call me Earth's twin.",
  Earth: "Hello, fellow human! You know me well.",
  Mars: "The Red Planet, waiting for your visit someday!",
  Jupiter: "I'm the largest planet—King of the Solar System.",
  Saturn: "My rings are my crown jewel. Aren’t they stunning?",
  Uranus: "An ice giant spinning on its side. Quite unique, huh?",
  Neptune: "The windiest planet—you better hold on tight!",
};

// ----------------------------------------------------------------
// CONTROLS: Orbit & Navigation
// ----------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 30, 100);

// ----------------------------------------------------------------
// POST-PROCESSING: Bloom for extra glow
// ----------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  2.5,   // bloom strength (higher for extra glow on high emissive areas)
  0.55,
  0.2
);
composer.addPass(bloomPass);

// ----------------------------------------------------------------
// INTERACTION: Info Panel & Zoom on Click
// ----------------------------------------------------------------
const planetInfo = document.getElementById("planet-info");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const selectedPlanet = intersects[0].object;

    // Show chat box
    chatBox.style.display = "flex";

    // Add initial message
    chatContent.innerHTML = `<p>🌌 ${selectedPlanet.name}: Hello! I'm ${selectedPlanet.name}. Ask me something!</p>`;
    chatInput.focus();

    // Handle sending messages
    chatSend.onclick = () => {
      const userMessage = chatInput.value;
      if (userMessage.trim()) {
        chatContent.innerHTML += `<p>🧑‍🚀 You: ${userMessage}</p>`;
        chatContent.innerHTML += `<p>🌌 ${selectedPlanet.name}: ${
          planetChats[selectedPlanet.name] || "Nice to chat with you!"
        }</p>`;
        chatInput.value = ""; // Clear input
        chatContent.scrollTop = chatContent.scrollHeight; // Scroll to the bottom
      }
    };
  }
});


function zoomToPlanet(planet) {
  const duration = 2; // seconds for the zoom transition
  const targetPosition = new THREE.Vector3(
    planet.position.x,
    planet.position.y,
    planet.position.z + 5
  );
  const initialPosition = camera.position.clone();
  let elapsedTime = 0;
  function animateZoom() {
    elapsedTime += 1 / 60;
    const t = elapsedTime / duration;
    if (t < 1) {
      camera.position.lerpVectors(initialPosition, targetPosition, t);
      controls.target.lerp(planet.position, t);
      requestAnimationFrame(animateZoom);
    } else {
      controls.target.copy(planet.position);
    }
  }
  animateZoom();
}

// ----------------------------------------------------------------
// ADD TOGGLE SWITCH FUNCTIONALITY FOR ORBITS & MOVEMENT
// ----------------------------------------------------------------
const toggleOrbitsCheckbox = document.getElementById("toggle-orbits");
toggleOrbitsCheckbox.addEventListener("change", (event) => {
  const showOrbits = event.target.checked;
  orbitLines.forEach((orbitLine) => {
    orbitLine.visible = showOrbits;
  });
});

let movementEnabled = true;
const toggleMovementButton = document.getElementById("toggle-movement");
toggleMovementButton.addEventListener("click", () => {
  movementEnabled = !movementEnabled;
  toggleMovementButton.textContent = movementEnabled ? "Stop Movement" : "Start Movement";
});

// ----------------------------------------------------------------
// ANIMATION LOOP
// ----------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the Sun for a dynamic effect
  sun.rotation.y += 0.01;
  
  // Update planetary orbits and rotations if movement is enabled
  if (movementEnabled) {
    planets.forEach((planet) => {
      planet.orbit.angle += planet.orbit.speed;
      planet.position.x = planet.orbit.radius * Math.cos(planet.orbit.angle);
      planet.position.z = planet.orbit.radius * Math.sin(planet.orbit.angle);
      planet.rotation.y += planet.rotationSpeed;
    });
  }
  
  controls.update();
  composer.render();
}
animate();

// ----------------------------------------------------------------
// HANDLE WINDOW RESIZE
// ----------------------------------------------------------------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
