import AppIntents

/// "What's the next step in Recipely?"
///
/// - Note: **The cursor lives in the app, not here.** The argument is always
///   `next`; which step that is depends on how far the cook has got, and only
///   the screen knows that.
@available(iOS 17.2, *)
struct RecipelyReadNextStepIntent: AppIntent {
  static let title: LocalizedStringResource = "Read Next Step"
  static let description = IntentDescription("Reads the next step of the recipe you are cooking.")
  static let openAppWhenRun = true

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "readNextStep", action: "readStep", arg: "next")
    return .result()
  }
}
