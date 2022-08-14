import "./style.css";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

let width = 800;
let height = 600;
let dpr = window.devicePixelRatio;
let appDomRoot = document.getElementById("app")!;
let ownEnv = false;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

let renderer = new THREE.WebGLRenderer({
	antialias: true,
});
renderer.setPixelRatio(dpr);
renderer.setSize(width, height);

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;

//renderer.setSize(width * dpr, height * dpr, false);
//document.body.appendChild(renderer.domElement);
//renderer.domElement.style.width = width + "px";
//renderer.domElement.style.height = height + "px";

appDomRoot.appendChild(renderer.domElement);

let gold = 0xfffd87;
let silver = 0xffffff;

let geometry = new THREE.BoxGeometry(3, 3, 3);
//let geometry = new THREE.TorusGeometry(2, 0.5, 32, 128);
//let geometry = new THREE.RingBufferGeometry(2, 2.5, 32, 128);
let material = new THREE.MeshPhysicalMaterial({
	color: silver,
	roughness: 0.02,
	metalness: 1,
});
let cube = new THREE.Mesh(geometry, material);
cube.rotation.x = 0.3;
cube.rotation.y = 0.8;
scene.add(cube);

camera.position.z = 5;

function createRGBLights() {
	let light = new THREE.PointLight(0xff4444, 1.0);
	light.position.set(10, 0, 10);
	scene.add(light);

	light = new THREE.PointLight(0x44ff44, 1.0);
	light.position.set(-10, 0, 10);
	scene.add(light);

	light = new THREE.PointLight(0x4444ff, 1.0);
	light.position.set(0, 5, 0);
	scene.add(light);
}

async function loadEnvironment() {
	let pmremGenerator = new THREE.PMREMGenerator(renderer); // dispose?
	pmremGenerator.compileEquirectangularShader();

	let exrCubeRenderTarget: THREE.WebGLRenderTarget; // must dispose

	let loader = new EXRLoader();
	//let texture = await loader.loadAsync("/textures/wooden_lounge_1k.exr");
	//let texture = await loader.loadAsync("/textures/pretville_cinema_2k-blur16px.exr");
	let texture = await loader.loadAsync("/textures/pretville_cinema_2k-clonerB.exr");
	exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
	texture.dispose();

	// Not sure why this doesn't work:
	//scene.environment = texture;

	material.envMap = exrCubeRenderTarget.texture;
	material.envMapIntensity = 1.0;
	material.needsUpdate = true;
}

function generateEnvironment() {
	let scene = new THREE.Scene();

	let nBulbRows = 4;
	let nBulbs = 7;
	let anglePerBulb = (Math.PI * 2) / nBulbs;
	let bulbFill = 0.85;
	let bulbRadius = 10;
	let bulbRowHeight = 10;
	let bulbAngleJitter = 0.2;
	let bulbSizeJitter = 0.9;

	let bulbMaterials: THREE.MeshPhysicalMaterial[] = [];
	let materialColors = [0xffffff, 0xffffff, 0xffeeee, 0xffff88];
	let materialStrengths = [1, 2, 4, 8, 16].map((x) => x * 0.7);
	for (let i = 0; i < 31; i++) {
		bulbMaterials.push(
			new THREE.MeshPhysicalMaterial({
				emissive: materialColors[i % materialColors.length],
				emissiveIntensity: materialStrengths[i % materialStrengths.length],
			})
		);
	}

	let whiteMaterial = new THREE.MeshPhysicalMaterial({
		emissive: 0xf8f8ff,
		emissiveIntensity: 0.1,
	});

	let redMaterial = new THREE.MeshPhysicalMaterial({
		emissive: 0xff0000,
		emissiveIntensity: 8,
	});

	let im = 0;
	let height = bulbRowHeight * (nBulbRows / 2);
	for (let row = 0; row < nBulbRows; row++) {
		let thetaInc = (Math.PI * 2) / nBulbs;
		for (let theta = 0; theta < Math.PI * 2; theta += thetaInc) {
			let th = theta + (Math.random() - 0.5) * bulbAngleJitter * thetaInc;
			let r = anglePerBulb * bulbFill * bulbRadius * 0.5;
			r *= 1.0 + (Math.random() - 0.5) * bulbSizeJitter;
			let geometry = new THREE.SphereGeometry(r, 32, 32);
			let sphere = new THREE.Mesh(geometry, bulbMaterials[im % bulbMaterials.length]);
			sphere.position.set(bulbRadius * Math.cos(th), height, bulbRadius * Math.sin(th));
			scene.add(sphere);
			im++;
		}
		height -= bulbRowHeight;
	}

	let ringsHeight = 70;
	let nRings = 5;
	for (let i = 0; i < nRings; i++) {
		let geometry = new THREE.TorusGeometry(50, 15, 32, 32);
		let ring = new THREE.Mesh(geometry, bulbMaterials[im % bulbMaterials.length]);
		im++;
		//if (i === 3) ring.material = redMaterial;
		ring.position.set(0, 0, -ringsHeight / 2 + (i * ringsHeight) / nRings);
		ring.rotation.x = i * 0.05;
		ring.rotation.y = i * 0.03;
		scene.add(ring);
	}

	let pmremGenerator = new THREE.PMREMGenerator(renderer); // dispose?
	pmremGenerator.compileCubemapShader();

	let exrCubeRenderTarget: THREE.WebGLRenderTarget; // must dispose

	exrCubeRenderTarget = pmremGenerator.fromScene(scene, 0.05, 0.1, 100);

	material.envMap = exrCubeRenderTarget.texture;
	material.envMapIntensity = 1.0;
	material.needsUpdate = true;
}

if (ownEnv) {
	//createRGBLights();
	generateEnvironment();
} else {
	loadEnvironment();
}

function animate() {
	requestAnimationFrame(animate);
	cube.rotation.x += 0.001;
	//cube.rotation.y += 0.001;
	renderer.render(scene, camera);
}
animate();
