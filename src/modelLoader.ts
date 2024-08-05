/**
 * モデルの読み込みとスケーリングを担当するモジュール。
 * GLTF形式のモデルを読み込み、特定のサイズ条件に合わせてスケーリングします。
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/libs/draco/');
const gltfLoader = new GLTFLoader(); // GLTFLoaderをインスタンス化
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * GLTFモデルをロードし、特定のサイズ条件に合わせてスケールを調整し、Promiseでモデルを返す関数
 * @param url モデルのURL
 * @return {Promise<THREE.Group<THREE.Object3DEventMap>>} ロードされスケールされたモデルを含むPromise。
 */
export const loadAndScaleModel = (url: string): Promise<THREE.Group<THREE.Object3DEventMap>> => new Promise(
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
