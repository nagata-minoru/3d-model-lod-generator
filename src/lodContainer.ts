import * as THREE from 'three';
import { SceneSetup } from './sceneSetup';

type Model = THREE.Object3D<THREE.Object3DEventMap>;

export const showLodContainer = (model: Model, lodModel: Model) => {
  const sceneContainer = document.getElementById('lod-container');
  if (!sceneContainer) return;

  const sceneSetup = new SceneSetup(sceneContainer, 0, 1, 2);

  const lod = new THREE.LOD();
  lod.addLevel(model, 0);
  lod.addLevel(lodModel, 5);
  sceneSetup.scene.add(lod);
  sceneSetup.animate();
}
