import AppIntents

/// "Start the timer in Recipely."
///
/// - Note: **No duration parameter, on purpose.** The action starts the cook
///   timer the recipe on screen declares; an arbitrary countdown is what the
///   system Clock is for, and offering one here would be a worse version of it.
@available(iOS 17.2, *)
struct RecipelyStartTimerIntent: AppIntent {
  static let title = LocalizedStringResource("Start Cooking Timer", table: "RecipelyIntents")
  static let description = IntentDescription(LocalizedStringResource("Starts the cook timer for the recipe you are on.", table: "RecipelyIntents"))
  static let openAppWhenRun = true

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "startTimer", action: "startTimer", arg: nil)
    return .result()
  }
}
