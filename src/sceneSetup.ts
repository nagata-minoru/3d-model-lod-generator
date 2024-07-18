import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls;

export const LIGHT_POSITION_1 = { x: 5, y: 10, z: 7.5 };
export const LIGHT_POSITION_2 = { x: -5, y: -10, z: -7.5 };

/**
 * シーンに光源を作成して追加します。
 * @param {THREE.Scene} scene - 光源を追加するシーン。
 * @param {{ x: number, y: number, z: number }} position - 光源の位置を表すオブジェクト。
 */
export const createLight = (scene: THREE.Scene, position: { x: number, y: number, z: number }): void => {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(position.x, position.y, position.z);
  scene.add(directionalLight);
}

/**
 * シーン、カメラ、レンダラー、コントロールのセットアップを行います。
 */
export const setupScene = (container: HTMLElement) => {
  scene = new THREE.Scene();
  const containerRect = container.getBoundingClientRect();

  renderer = new THREE.WebGLRenderer();
  container.appendChild(renderer.domElement);
  renderer.setSize(containerRect.width, containerRect.height);

  camera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.object.position.set(2, 0, 0);
  controls.target.set(2, 0, 0);

  createLight(scene, LIGHT_POSITION_1);
  createLight(scene, LIGHT_POSITION_2);

  camera.position.z = 5;
};

/**
 * アニメーションを実行します。
 */
export const animate = (): void => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};
