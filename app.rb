require 'sinatra/base'
require 'sinatra/json'
require 'open3'
require 'tempfile'
require 'pry-byebug'

class LodApp < Sinatra::Base
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
      # 入力ファイルを一時的な場所に保存
      input_file = params[:file][:tempfile]
      input_file_path = params[:file][:filename]
      File.open(input_file_path, 'wb') do |f|
        f.write(input_file.read)
      end

      output_file_path = "output_#{params[:file][:filename]}"

      ratio = params[:ratio].to_f
      error = params[:error].to_f

      command = "npx gltf-transform simplify #{input_file_path} #{output_file_path} --ratio #{ratio} --error #{error}"
      stdout, stderr, status = Open3.capture3(command)

      if status.success?
        content_type 'application/octet-stream'
        send_file output_file_path, filename: "output_#{input_file_path}", type: 'Application/octet-stream'
      else
        halt 500, json(message: "LODの作成エラー: #{stderr}")
      end
    rescue => e
      halt 500, json(message: "サーバーエラー: #{e.message}")
    ensure
      File.delete(input_file_path) if File.exist?(input_file_path)
    end
  end

  # Sinatraアプリケーションの開始
  run! if app_file == $0
end
