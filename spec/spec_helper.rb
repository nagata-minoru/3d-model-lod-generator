ENV['RACK_ENV'] = 'test'

require 'rack/test'
require 'rspec'
require 'tmpdir'
require_relative '../app'

##
# テストで使うヘルパーメソッドをまとめたモジュールです。
#
module SpecHelpers
  ##
  # spec/fixtures にあるファイルのパスを返します。
  #
  # name:: フィクスチャのファイル名
  #
  # 戻り値:: フィクスチャの絶対パス
  #
  def fixture_path(name)
    File.expand_path("fixtures/#{name}", __dir__)
  end
end

RSpec.configure do |config|
  config.include Rack::Test::Methods
  config.include SpecHelpers

  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end
  config.disable_monkey_patching!
  config.order = :random
end
