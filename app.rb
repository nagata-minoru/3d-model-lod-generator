require 'sinatra/base'
require 'sinatra/json'
require 'open3'
require 'mini_magick'
require 'tempfile'
require 'pry-byebug'

##
# LodAppは、SinatraベースのWebアプリケーションです。このアプリケーションは、GLTFモデルの
# LOD (Level of Detail) を生成し、画像を保存し、平均色を計算するAPIを提供します。
#
class LodApp < Sinatra::Base
  set :port, ENV['PORT'] || 4567
  set :public_folder, File.expand_path('../dist', __FILE__)

  ##
  # ルートURLにアクセスした際に、index.htmlファイルを返します。
  #
  get '/' do
    send_file File.join(settings.public_folder, 'index.html')
  end

  ##
  # POST /api/create_lod
  # パラメータからGLTFファイルを受け取り、指定された比率と誤差で
  # LODを生成します。
  #
  # @param [File] file GLTFファイル
  # @param [Float] ratio LODの比率
  # @param [Float] error 許容誤差
  #
  # @return [File] 生成されたLODファイル
  #
  post '/api/create_lod' do
    content_type :json

    # パラメータの確認
    unless params[:file] && params[:ratio] && params[:error] && params[:compressionRate]
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

      # 中間ファイルと出力ファイルも一時ファイルとして準備
      intermediate_tempfile = Tempfile.new(['intermediate_', File.extname(input_file_name)])
      output_tempfile = Tempfile.new(['output_', File.extname(input_file_name)])

      ratio = params[:ratio].to_f
      error = params[:error].to_f
      compression_rate = params[:compressionRate].to_f

      # glb-texture-converterを実行
      converter_command =
        "npx glb-texture-converter #{input_tempfile.path} #{intermediate_tempfile.path} #{compression_rate}"

      converter_stdout, converter_stderr, converter_status = Open3.capture3(converter_command)

      unless converter_status.success?
        halt 500, json(message: "glb-texture-converterの実行エラー: #{converter_stderr}")
      end

      # gltf-transformを実行
      transform_command =
        "npx gltf-transform simplify" \
        " #{intermediate_tempfile.path}" \
        " #{output_tempfile.path} " \
        " --ratio #{ratio}" \
        " --error #{error}"

      transform_stdout, transform_stderr, transform_status = Open3.capture3(transform_command)

      if transform_status.success?
        content_type 'application/octet-stream'
        # 一時ファイルをクローズして再度開く
        output_tempfile.close
        send_file output_tempfile.path
      else
        halt 500, json(message: "LODの作成エラー: #{transform_stderr}")
      end
    rescue => e
      halt 500, json(message: "サーバーエラー: #{e.message}")
    ensure
      input_tempfile.close!
      intermediate_tempfile.close!
      # output_tempfile.close!
    end
  end

  ##
  # POST /api/save_image
  # Base64エンコードされた画像データを受け取り、サーバーに保存します。
  # また、保存した画像の平均色を計算して返します。
  #
  # @param [String] imageDataUrl Base64エンコードされた画像データURL
  #
  # @return [Hash] 保存成功メッセージと画像の平均色
  #
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
      File.open(filepath, 'wb') { |file| file.write(decoded_image) }

      # 画像を読み込み
      image = MiniMagick::Image.open(filepath)

      # ピクセルデータを取得して平均色を計算
      pixels = image.get_pixels
      total_pixels = 0
      sum_r = sum_g = sum_b = 0

      pixels.each do |row|
        row.each do |pixel|
          r, g, b = pixel[0], pixel[1], pixel[2]
          next if r == 0 && g == 0 && b == 0

          sum_r += r
          sum_g += g
          sum_b += b
          total_pixels += 1
        end
      end

      avg_r = sum_r / total_pixels
      avg_g = sum_g / total_pixels
      avg_b = sum_b / total_pixels

      json(message: "画像が正常に保存されました", average_color: sprintf("#%02x%02x%02x", avg_r, avg_g, avg_b))
    rescue => e
      halt 500, json(message: "画像保存エラー: #{e.message}")
    ensure
      # temp_file.close! if temp_file
    end
  end

  # Sinatraアプリケーションの開始
  run! if app_file == $0
end
