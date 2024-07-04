import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const spinner = document.getElementById('spinner') as HTMLElement;
const overlay = document.getElementById('overlay') as HTMLElement;
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;
let lodModel: THREE.Object3D | null = null;

const createLight = (scene: THREE.Scene, x: number, y: number, z: number): void => {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(x, y, z);
  scene.add(directionalLight);
}

const animate = (): void => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

const displayModel = (dataUrl: string): void => {
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(dataUrl, gltf => {
    const model = gltf.scene;
    scene.add(model);
    createBoundingBox(model);
    animate();
  });
}

const createBoundingBox = (model: THREE.Object3D): void => {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x5b4c47 });

  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.set(
    (box.min.x + box.max.x) / 2 + 4,
    (box.min.y + box.max.y) / 2,
    (box.min.z + box.max.z) / 2
  );
  scene.add(boxMesh);
}

const loadModels = (lodPath: string) => {
  lodModel && scene.remove(lodModel);

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(lodPath, (gltf) => {
    lodModel = gltf.scene;
    lodModel.position.x = 2; // Offset to distinguish between original and LOD
    scene.add(lodModel);
    animate();
  });
}

// DOM操作
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[name="file"]') as HTMLInputElement;
  fileInput.oninput = (event: Event) => {
    // 初期化
    scene = new THREE.Scene();

    // 既存のレンダラー要素を削除
    const existingCanvas = document.querySelector('canvas');
    existingCanvas && existingCanvas.remove();

    // 新しいレンダラー要素を追加
    renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    const adjustedHeight = window.innerHeight - 451;
    renderer.setSize(window.innerWidth, adjustedHeight);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / adjustedHeight, 0.1, 1000);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.object.position.set(2, 0, 0);
    controls.target.set(2, 0, 0);
    createLight(scene, 5, 10, 7.5);
    createLight(scene, -5, -10, -7.5);
    camera.position.z = 5;

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => e.target?.result && displayModel(e.target.result as string);
    reader.readAsDataURL(file);
  };

  (document.getElementById('uploadForm') as HTMLFormElement).onsubmit = async function (event: Event) {
    spinner.classList.add('show');
    overlay.classList.add('show');

    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    try {
      const response = await fetch('/api/create_lod', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      loadModels(URL.createObjectURL(await response.blob()));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      spinner.classList.remove('show');
      overlay.classList.remove('show');
    }
  };
});
