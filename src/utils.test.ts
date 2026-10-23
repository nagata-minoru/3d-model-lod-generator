import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createBoundingBox, sendImageDataToServer, type BoxMesh } from './utils';

describe('createBoundingBox', () => {
  // 2 x 4 x 6 の箱を (1, 2, 3) に置いたモデル
  const createModel = () => {
    const model = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6));
    mesh.position.set(1, 2, 3);
    model.add(mesh);
    return model;
  };

  it('モデルと同じ大きさの箱を作る', () => {
    const [boxMesh, box] = createBoundingBox(createModel(), '#ff0000') as [BoxMesh, THREE.Box3];

    const { width, height, depth } = boxMesh.geometry.parameters;
    expect([width, height, depth]).toEqual([2, 4, 6]);
    expect(box.min.toArray()).toEqual([0, 0, 0]);
    expect(box.max.toArray()).toEqual([2, 4, 6]);
  });

  it('指定した色のマテリアルを使う', () => {
    const [boxMesh] = createBoundingBox(createModel(), '#336699') as [BoxMesh, THREE.Box3];

    expect(boxMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(boxMesh.material.color.getHexString()).toBe('336699');
  });
});

describe('sendImageDataToServer', () => {
  const imageDataUrl = 'data:image/png;base64,AAAA';

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('画像データを JSON で送り、平均色を返す', async () => {
    const fetchMock = vi.fn(async () => Response.json({ message: '保存しました', average_color: '#ff0000' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendImageDataToServer(imageDataUrl)).resolves.toBe('#ff0000');
    expect(fetchMock).toHaveBeenCalledWith('/api/save_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl }),
    });
    expect(console.log).toHaveBeenCalledWith('保存しました');
  });

  it.each([{
    name: 'サーバーがエラーを返した', fetchImpl: async () => new Response('', { status: 500 }),
  }, {
    name: '通信に失敗した', fetchImpl: async () => { throw new TypeError('Failed to fetch'); },
  }])('$name ときは undefined を返す', async ({ fetchImpl }) => {
    vi.stubGlobal('fetch', vi.fn(fetchImpl));

    await expect(sendImageDataToServer(imageDataUrl)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
