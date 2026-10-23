require 'base64'
require 'json'

RSpec.describe LodApp do
  ##
  # rack-test がリクエストを送る先のアプリを返します。
  #
  # 戻り値:: LodApp
  #
  def app
    LodApp
  end

  describe 'POST /api/create_lod' do
    let(:glb) { Rack::Test::UploadedFile.new(fixture_path('cube.glb'), 'model/gltf-binary') }
    let(:params) { { file: glb, ratio: '0.5', error: '0.01', compressionRate: '0.5' } }

    it 'パラメータが足りないと 400 を返す' do
      post '/api/create_lod', params.except(:ratio)

      expect(last_response.status).to eq 400
      expect(JSON.parse(last_response.body)['message']).to eq 'パラメータが不足しています'
    end

    it 'LOD を作った GLB を返す' do
      post '/api/create_lod', params

      expect(last_response.status).to eq 200
      expect(last_response.content_type).to eq 'application/octet-stream'
      expect(last_response.body.byteslice(0, 4)).to eq 'glTF'
    end

    it 'GLB でないファイルを送ると 500 を返す' do
      text = Rack::Test::UploadedFile.new(fixture_path('red.png'), 'image/png')
      post '/api/create_lod', params.merge(file: text)

      expect(last_response.status).to eq 500
      expect(JSON.parse(last_response.body)['message']).to start_with 'glb-texture-converterの実行エラー'
    end
  end

  describe 'POST /api/save_image' do
    around do |example|
      original = LodApp.public_folder
      Dir.mktmpdir do |dir|
        LodApp.set :public_folder, dir
        example.run
      ensure
        LodApp.set :public_folder, original
      end
    end

    ##
    # 画像ファイルをデータ URL にして /api/save_image に送ります。
    #
    # name:: 送るフィクスチャのファイル名
    #
    # 戻り値:: レスポンス
    #
    def post_image(name)
      data_url = "data:image/png;base64,#{Base64.strict_encode64(File.binread(fixture_path(name)))}"
      post '/api/save_image', { imageDataUrl: data_url }.to_json, 'CONTENT_TYPE' => 'application/json'
      last_response
    end

    it '画像を保存し、平均色を返す' do
      response = post_image('red.png')

      expect(response.status).to eq 200
      expect(JSON.parse(response.body)).to eq(
        'message' => '画像が正常に保存されました', 'average_color' => '#ff0000'
      )
      saved = Dir.glob(File.join(LodApp.public_folder, 'saved_images', 'image_*.png'))
      expect(saved.size).to eq 1
      expect(File.binread(saved.first)).to eq File.binread(fixture_path('red.png'))
    end

    it '黒いピクセルは平均色の計算に入れない' do
      response = post_image('half_black_blue.png')

      expect(JSON.parse(response.body)['average_color']).to eq '#0000ff'
    end

    it '真っ黒な画像では 500 を返す' do
      response = post_image('black.png')

      expect(response.status).to eq 500
      expect(JSON.parse(response.body)['message']).to start_with '画像保存エラー'
    end

    it '画像データでない JSON を送ると 500 を返す' do
      post '/api/save_image', '{}', 'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq 500
    end
  end
end
