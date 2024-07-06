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

const gltfLoader = new GLTFLoader(); // GLTFLoaderをインスタンス化

/**
 * GLTFモデルをロードし、特定のサイズ条件に合わせてスケールを調整し、Promiseでモデルを返す関数
 * @param url モデルのURL
 * @return ロードされスケールされたモデルを含むPromise
 */
const loadAndScaleModel = (url: string): Promise<THREE.Group<THREE.Object3DEventMap>> => new Promise(
  resolve => {
    gltfLoader.load(url, (gltf) => {
      const model = gltf.scene;

      // モデルのバウンディングボックスを計算
      const size = new THREE.Vector3();
      (new THREE.Box3().setFromObject(model)).getSize(size);

      // 最大寸法を1に設定し、他の寸法を比率を保ちながらスケールする
      const maxDimension = Math.max(size.x, size.y, size.z);
      model.scale.set(2 / maxDimension, 2 / maxDimension, 2 / maxDimension);

      resolve(model);  // モデルをresolveで返す
    });
  }
);

const sendImageDataToServer = async (imageDataUrl: string) => {
  try {
    const response = await fetch('/api/save_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageDataUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result.message);
  } catch (error) {
    console.error('Error sending image data:', error);
  }
};

const downloadImageData = (imageDataUrl: string) => {
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = 'model-image.png'; // ここでダウンロードするファイル名を設定
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const createStaticModelViewer = async (model: THREE.Group) => {
  const scene = new THREE.Scene();

  const staticViewerContainer = document.getElementById('model-viewer') as HTMLDivElement;

  const renderer = new THREE.WebGLRenderer();
  staticViewerContainer.appendChild(renderer.domElement);
  const containerRect = staticViewerContainer.getBoundingClientRect();
  renderer.setSize(containerRect.width, containerRect.height);

  const viewerCamera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);

  // モデルのバウンディングボックスを計算
  const boundingBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  // カメラの位置を設定
  viewerCamera.position.z = 3;

  // カメラをモデルの中心に向ける
  viewerCamera.lookAt(center);

  createLight(scene, 5, 10, 7.5);
  createLight(scene, -5, -10, -7.5);

  scene.add(model);

  renderer.render(scene, viewerCamera);

  // レンダリングされた画像をBase64エンコードされた文字列として取得
  const imageDataUrl = renderer.domElement.toDataURL('image/png');
  await sendImageDataToServer(imageDataUrl);
}

const displayModel = async (dataUrl: string): Promise<void> => {
  const model = await loadAndScaleModel(dataUrl)
  scene.add(model);
  createBoundingBox(model);
  animate();

  createStaticModelViewer(model.clone());
}

const createBoundingBox = (model: THREE.Object3D): void => {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x5b4c47 });

  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boxMesh.position.set((box.min.x + box.max.x) / 2 + 4, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  scene.add(boxMesh);
}

const loadModels = async (lodPath: string) => {
  lodModel && scene.remove(lodModel);
  lodModel = await loadAndScaleModel(lodPath);
  lodModel.position.x = 2; // Offset to distinguish between original and LOD
  scene.add(lodModel);
  animate();
}

// DOM操作
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[name="file"]') as HTMLInputElement;
  fileInput.oninput = (event: Event) => {
    // 初期化
    scene = new THREE.Scene();

    // scene-container要素を取得
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) return;

    // 既存のレンダラー要素を削除
    const existingCanvas = document.querySelector('canvas');
    existingCanvas && existingCanvas.remove();

    // 新しいレンダラー要素を追加
    renderer = new THREE.WebGLRenderer();
    sceneContainer.appendChild(renderer.domElement);

    // レンダラーのサイズをscene-containerに合わせる
    const containerRect = sceneContainer.getBoundingClientRect();
    renderer.setSize(containerRect.width, containerRect.height);
    camera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.object.position.set(2, 0, 0);
    controls.target.set(2, 0, 0);
    createLight(scene, 5, 10, 7.5);
    createLight(scene, -5, -10, -7.5);
    camera.position.z = 5;

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => e.target?.result && await displayModel(
      e.target.result as string
    );

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
