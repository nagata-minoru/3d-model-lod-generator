/**
 * ユーティリティ関数を提供するモジュール。
 * バウンディングボックスの作成や画像データのサーバー送信などの汎用的な機能を含みます。
 */

import * as THREE from 'three';

/**
 * BoxMeshは、THREE.jsのボックスジオメトリとメッシュマテリアル、およびイベントマップを使用したメッシュを表す型です。
 */
export type BoxMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;

/**
 * モデルのバウンディングボックスを作成して返します。
 * @param {THREE.Object3D} model - ボックスを作成する対象のモデル。
 * @param {string} averageColorString - ボックスの色を指定するための平均色。
 * @return {BoxMesh} - 作成されたバウンディングボックスのメッシュ。
 */
export const createBoundingBox = (model: THREE.Object3D, averageColorString: string) => {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: averageColorString });

  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  return [boxMesh, box];
}

/**
 * 画像データをサーバーに送信します。
 * @param {string} imageDataUrl - 送信する画像データのURL。
 * @return {Promise<string>} - サーバーからの応答として返された平均色。
 */
export const sendImageDataToServer = async (imageDataUrl: string): Promise<string | undefined> => {
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
    return result.average_color;
  } catch (error) {
    console.error('Error sending image data:', error);
  }
};
