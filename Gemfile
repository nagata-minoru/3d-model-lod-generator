source 'https://rubygems.org'

gem 'sinatra'
gem "sinatra-contrib"
gem "rackup", "~> 2.3"
gem "webrick", "~> 1.9"  # rackup 2.3 から依存に含まれなくなったので、Web サーバとして明示する
gem "pry-byebug", "~> 3.12"
gem "mini_magick"

# 開発環境用のgem
group :development do
  gem 'pry', '~> 0.16'  # デバッグ用
  gem 'rubocop', '~> 1.50'  # コードスタイルチェック用
end

# テスト用のgem
group :test do
  gem 'rspec', '~> 3.13'  # テストフレームワーク
end
