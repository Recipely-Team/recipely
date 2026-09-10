import AppIntents

/// "Ask Recipely" — then Siri asks what, and the assistant decides.
///
/// - Note: **The one entry with no fixed action.** Every other intent names a
///   word the registry already answers; this one hands a sentence to the
///   assistant and lets it choose. That is what makes it the whole of the in-app
///   assistant rather than a slice of it.
/// - Note: **Two turns, because Siri gives no other way.** A freeform `String`
///   inside an App Shortcut phrase is not recognised, so the phrase carries no
///   parameter and `requestValueDialog` makes Siri ask. See D1.
/// - Note: **It opens the app today.** Answering in a Siri snippet needs a
///   scoped token the app does not yet hold — `publishCredentials` waits on the
///   backend route. Until then the question is carried into the running
///   assistant, which is the honest degradation: slower, never wrong.
@available(iOS 17.2, *)
struct RecipelyAskIntent: AppIntent {
  static let title: LocalizedStringResource = "Ask Recipely"
  static let description = IntentDescription("Asks the Recipely cooking assistant anything.")
  static let openAppWhenRun = true

  @Parameter(
    title: "Question",
    requestValueDialog: "What would you like to ask?"
  )
  var question: String

  init() {}

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyRequest.enqueue(id: "askRecipely", action: nil, arg: question)
    return .result()
  }
}
