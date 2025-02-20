/**
 * メインエントリーポイント。
 * シーンのセットアップ、モデルの読み込み、バウンディングボックスの作成、およびサーバーとの通信を行います。
 */

import * as THREE from 'three';
import { SceneSetup } from './sceneSetup';
import { loadAndScaleModel } from './modelLoader';
import { createBoundingBox, sendImageDataToServer, BoxMesh } from './utils';
import { showLodContainer } from './lodContainer';
import { Model } from './lodContainer';

const spinner = document.getElementById('spinner') as HTMLElement;
const overlay = document.getElementById('overlay') as HTMLElement;
let lodModel: THREE.Object3D | null = null;

/**
 * 静的なモデルビューアを作成し、モデルのレンダリング画像をサーバーに送信します。
 * @param {THREE.Group} model - レンダリングするモデル。
 * @return {Promise<string | undefined>} - サーバーからの応答として返された平均色。
 */
const createStaticModelViewer = async (sceneSetup: SceneSetup, model: THREE.Group): Promise<string | undefined> => {
  // モデルのバウンディングボックスを計算
  const boundingBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  sceneSetup.setupSceneLighting();
  sceneSetup.scene.add(model);
  sceneSetup.renderer.render(sceneSetup.scene, sceneSetup.camera);

  // レンダリングされた画像をBase64エンコードされた文字列として取得
  const imageDataUrl = sceneSetup.renderer.domElement.toDataURL('image/png');
  return await sendImageDataToServer(imageDataUrl);
}

/**
 * モデルを表示し、ボックスを作成します。
 * @param {string} dataUrl - モデルのデータURL。
 */
const displayModel = async (sceneSetup: SceneSetup, dataUrl: string): Promise<[Model, BoxMesh]> => {
  const model = await loadAndScaleModel(dataUrl)
  sceneSetup.animate();

  const averageColorString = (await createStaticModelViewer(sceneSetup, model.clone()))!;
  sceneSetup.scene.add(model);
  const [boxMesh, boxReceive] = createBoundingBox(model, averageColorString)
  const box = boxReceive as THREE.Box3;
  const boxMeshToShow = boxMesh.clone() as BoxMesh;
  boxMeshToShow.position.set((box.min.x + box.max.x) / 2 + 4, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2);
  averageColorString && sceneSetup.scene.add(boxMeshToShow);
  return [model, boxMesh as BoxMesh];
}

/**
 * モデルをロードし、シーンに追加します。
 * @param {string} lodPath - モデルのパス。
 */
const loadModels = async (sceneSetup: SceneSetup, lodPath: string): Promise<Model> => {
  lodModel && sceneSetup.scene.remove(lodModel);
  lodModel = await loadAndScaleModel(lodPath);
  const modelToShow = lodModel.clone();
  modelToShow.position.x = 2;
  sceneSetup.scene.add(modelToShow);
  return lodModel;
}

// DOM操作
document.addEventListener('DOMContentLoaded', () => {
  let sceneSetup: SceneSetup | null = null;
  let model: Model | null = null;
  let box: BoxMesh | null = null;
  const fileInput = document.querySelector('input[name="file"]') as HTMLInputElement;
  fileInput.oninput = (event: Event) => {
    // scene-container要素を取得
    const sceneContainer = document.getElementById('scene-container');
    if (!sceneContainer) return;

    sceneSetup = new SceneSetup(sceneContainer);

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) [model, box] = await displayModel(sceneSetup!, e.target.result as string);
    };

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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
      }
      const lodModel = await loadModels(sceneSetup!, URL.createObjectURL(await response.blob()));

      box?.position.set(0, 0.5, 0);
      showLodContainer(model!, lodModel, box!);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      spinner.classList.remove('show');
      overlay.classList.remove('show');
    }
  };
});
