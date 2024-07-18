# GLB Viewer with LOD

このプロジェクトは、Three.js を使用して GLB ファイルを読み込み、表示し、Level of Detail (LOD) を生成するウェブアプリケーションです。

## 機能

- GLB ファイルの読み込みと表示
- gltf-transform を使用した LOD の生成
- 元のモデルと LOD モデルの同時表示
- バウンディングボックスの表示
- モデルを読み込んだとき、そのモデルを象徴する色を決定します。

## 前提条件
- ruby 3.x 以上
- Node.js 12.0.0 以上

## インストール

1. リポジトリをクローンします:
  ```
  git clone https://github.com/nagata-minoru/3d-model-lod-generator.git
  cd 3d-model-lod-generator
  ```

2. 依存関係をインストールします:
  ```
  npm install
  bundle install
  ```

## 使用方法

- TypeScript開発用:
  ```
  npm run dev
  ```

o+Enterでブラウザが開きます。

- Sinatra開発用:
  ```
  ruby app.rb
  ```

localhost:4567にアクセスしてください。

## 貢献

プルリクエストは歓迎します。大きな変更を加える場合は、まず issue を開いて議論してください。

## ライセンス

[MIT](https://choosealicense.com/licenses/mit/)
