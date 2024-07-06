require 'sinatra/base'
require 'sinatra/json'
require 'open3'
require 'tempfile'
require 'pry-byebug'

class LodApp < Sinatra::Base
  set :public_folder, File.expand_path('../dist', __FILE__)

  get '/' do
    send_file File.join(settings.public_folder, 'index.html')
  end

  post '/api/create_lod' do
    content_type :json

    # パラメータの確認
    unless params[:file] && params[:ratio] && params[:error]
      halt 400, json(message: "パラメータが不足しています")
    end

    begin
      # 入力ファイルを一時ファイルとして保存
      input_file = params[:file][:tempfile]
      input_file_name = params[:file][:filename]
      input_tempfile = Tempfile.new([File.basename(input_file_name, '.*'), File.extname(input_file_name)])
      input_tempfile.binmode
      input_tempfile.write(input_file.read)
      input_tempfile.rewind

      # 出力ファイルも一時ファイルとして準備
      output_tempfile = Tempfile.new(['output_', File.extname(input_file_name)])

      ratio = params[:ratio].to_f
      error = params[:error].to_f

      command = "npx gltf-transform simplify #{input_tempfile.path} #{output_tempfile.path} --ratio #{ratio} --error #{error}"
      stdout, stderr, status = Open3.capture3(command)

      if status.success?
        content_type 'application/octet-stream'
        send_file output_tempfile.path, filename: "output_#{input_file_name}", type: 'application/octet-stream'
      else
        halt 500, json(message: "LODの作成エラー: #{stderr}")
      end
    rescue => e
      halt 500, json(message: "サーバーエラー: #{e.message}")
    ensure
      input_tempfile.close!
    end
  end

  post '/api/save_image' do
    content_type :json

    # パラメータの確認
    unless request.body
      halt 400, json(message: "画像データが不足しています")
    end

    begin
      # Base64エンコードされた画像を取得
      decoded_image = Base64.decode64(JSON.parse(request.body.read)['imageDataUrl'].split(',').last)

      # 保存するディレクトリとファイル名を設定
      save_dir = File.join(settings.public_folder, 'saved_images')
      FileUtils.mkdir_p(save_dir) unless File.directory?(save_dir)
      filename = "image_#{Time.now.strftime('%Y%m%d%H%M%S')}.png"
      filepath = File.join(save_dir, filename)

      # ファイルに直接書き込み
      File.open(filepath, 'wb') do |file|
        file.write(decoded_image)
      end

      # 成功レスポンス
      json(message: "画像が正常に保存されました")
    rescue => e
      halt 500, json(message: "画像保存エラー: #{e.message}")
    ensure
      # temp_file.close! if temp_file
    end
  end

  # Sinatraアプリケーションの開始
  run! if app_file == $0
end
