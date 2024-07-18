/**
 * メインエントリーポイント。
 * シーンのセットアップ、モデルの読み込み、バウンディングボックスの作成、およびサーバーとの通信を行います。
 */

import * as THREE from 'three';
import { LIGHT_POSITION_1, LIGHT_POSITION_2, createLight, setupScene, animate, scene } from './sceneSetup';
import { loadAndScaleModel } from './modelLoader';
import { createBoundingBox, sendImageDataToServer } from './utils';

const spinner = document.getElementById('spinner') as HTMLElement;
const overlay = document.getElementById('overlay') as HTMLElement;
let lodModel: THREE.Object3D | null = null;

/**
 * 静的なモデルビューアを作成し、モデルのレンダリング画像をサーバーに送信します。
 * @param {THREE.Group} model - レンダリングするモデル。
 * @return {Promise<string | undefined>} - サーバーからの応答として返された平均色。
 */
const createStaticModelViewer = async (model: THREE.Group): Promise<string | undefined> => {
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

  createLight(scene, LIGHT_POSITION_1);
  createLight(scene, LIGHT_POSITION_2);

  scene.add(model);

  renderer.render(scene, viewerCamera);

  // レンダリングされた画像をBase64エンコードされた文字列として取得
  const imageDataUrl = renderer.domElement.toDataURL('image/png');
  return await sendImageDataToServer(imageDataUrl);
}

/**
 * モデルを表示し、ボックスを作成します。
 * @param {string} dataUrl - モデルのデータURL。
 */
const displayModel = async (dataUrl: string): Promise<void> => {
  const model = await loadAndScaleModel(dataUrl)
  animate();

  const averageColorString = await createStaticModelViewer(model.clone());
  scene.add(model);
  averageColorString && scene.add(createBoundingBox(model, averageColorString));
}

/**
 * モデルをロードし、シーンに追加します。
 * @param {string} lodPath - モデルのパス。
 */
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
    // scene-container要素を取得
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) return;

    setupScene(sceneContainer);

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => e.target?.result && await displayModel(
      e.target.result as string
    );

    reader.readAsDataURL(file);
  };

  /**
   * フォーム送信イベントハンドラ。
   * @param {Event} event - フォーム送信イベント。
   */
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
