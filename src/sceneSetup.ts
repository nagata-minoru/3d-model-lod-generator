/**
 * シーンのセットアップを担当するモジュール。
 * シーン、カメラ、レンダラー、コントロールの初期化と光源の追加を行います。
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const LIGHT_POSITION_1 = { x: 5, y: 10, z: 7.5 };
const LIGHT_POSITION_2 = { x: -5, y: -10, z: -7.5 };

export class SceneSetup {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  constructor(container: HTMLElement, targetX: number = 2, cameraZ = 2.5, lightIntensity: number = 1.5) {
    this.scene = new THREE.Scene();
    const containerRect = container.getBoundingClientRect();

    this.renderer = new THREE.WebGLRenderer();
    container.appendChild(this.renderer.domElement);
    this.renderer.setSize(containerRect.width, containerRect.height);

    this.camera = new THREE.PerspectiveCamera(75, containerRect.width / containerRect.height, 0.1, 1000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.object.position.set(2, 0, 0);
    this.controls.target.set(targetX, 0, 0);

    this.setupSceneLighting(lightIntensity);

    this.camera.position.y = 0.5;
    this.camera.position.z = cameraZ;
  }

  /**
   * シーンに光源を作成して追加します。
   * @param {THREE.Scene} scene - 光源を追加するシーン。
   * @param {{ x: number, y: number, z: number }} position - 光源の位置を表すオブジェクト。
   */
  private createLight(scene: THREE.Scene, position: { x: number, y: number, z: number }, lightIntensity: number): void {
    const directionalLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    directionalLight.position.set(position.x, position.y, position.z);
    scene.add(directionalLight);
  }

  /**
   * シーンに光源を追加します。
   */
  setupSceneLighting(lightIntensity: number = 1.5) {
    this.createLight(this.scene, LIGHT_POSITION_1, lightIntensity);
    this.createLight(this.scene, LIGHT_POSITION_2, lightIntensity);
  }

  /**
   * アニメーションを実行します。
   */
  public animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
