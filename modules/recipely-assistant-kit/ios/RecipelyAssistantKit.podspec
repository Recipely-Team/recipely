require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'RecipelyAssistantKit'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = 'UNLICENSED'
  s.author         = 'Recipely'
  s.homepage       = 'https://recipely.net'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/Recipely-Team/recipely.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # `AppIntents/` is deliberately EXCLUDED. Xcode's AppIntentsMetadataProcessor
  # does not reliably extract intent metadata out of a static framework — and
  # `useFrameworks: "static"` in app.json makes every pod here exactly that — so
  # an intent compiled in this pod would build cleanly and then be invisible to
  # Siri, Spotlight and the Shortcuts app with no error anywhere. Those files
  # are copied into the app target by `plugins/withAssistantKit.js` instead.
  # See docs/os-assistants-plan.md finding D3.
  s.source_files         = '**/*.{h,m,swift}'
  s.exclude_files        = 'AppIntents/**/*'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
