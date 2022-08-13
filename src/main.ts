import "./style.css";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { text } from "stream/consumers";

let width = 800;
let height = 600;
let dpr = window.devicePixelRatio;
let appDomRoot = document.getElementById("app")!;

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

//let geometry = new THREE.BoxGeometry(3, 3, 3);
let geometry = new THREE.TorusGeometry(2, 0.5, 32, 128);
//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let material = new THREE.MeshPhysicalMaterial({
	//emissive: 0xff0000,
	//emissiveIntensity: 0.3,
	color: 0xffffd0,
	//color: 0xffffff,
	roughness: 0.25,
	metalness: 1,
});
let cube = new THREE.Mesh(geometry, material);
cube.rotation.x = 0.3;
cube.rotation.y = 0.8;
scene.add(cube);

/*
let light = new THREE.PointLight(0xff4444, 1.0);
light.position.set(10, 0, 10);
scene.add(light);

light = new THREE.PointLight(0x44ff44, 1.0);
light.position.set(-10, 0, 10);
scene.add(light);

light = new THREE.PointLight(0x4444ff, 1.0);
light.position.set(0, 5, 0);
scene.add(light);
*/

camera.position.z = 5;

let pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let exrCubeRenderTarget: THREE.WebGLRenderTarget;

async function loadEnvironment() {
	let loader = new EXRLoader();
	//let texture = await loader.loadAsync("/textures/wooden_lounge_1k.exr");
	let texture = await loader.loadAsync("/textures/pretville_cinema_2k.exr");
	exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
	texture.dispose();
	//scene.environment = texture;

	material.envMap = exrCubeRenderTarget.texture;
	material.envMapIntensity = 1.0;
	material.needsUpdate = true;
	/*
	let material = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		roughness: 0.1,
		metalness: 0.9,
		envMapIntensity: 1.0,
		envMap: texture,
	});
	scene.remove(cube);

	cube = new THREE.Mesh(geometry, material);
	cube.rotation.x = 0.3;
	cube.rotation.y = 0.8;
	scene.add(cube);
	*/
}

loadEnvironment();

function animate() {
	requestAnimationFrame(animate);
	cube.rotation.x += 0.001;
	cube.rotation.y += 0.001;
	renderer.render(scene, camera);
}
animate();
