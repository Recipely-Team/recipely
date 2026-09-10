import AppIntents
import Foundation
import RecipelyAssistantKit

/// Faz 0's proof intent: search, adopting Apple's own free-text search schema.
///
/// - Note: **`.system.searchInApp` is how free text reaches the app at all.**
///   Siri refuses a freeform `String` parameter inside an App Shortcut phrase —
///   only enums and entities are recognised there — but this schema is passed
///   Siri's raw query verbatim. It is the only single-turn path for an
///   arbitrary sentence. See docs/os-assistants-plan.md finding D1.
/// - Note: **It opens the app on purpose.** A search shows a list the user
///   scrolls; answering it in a Siri snippet would be showing a feed through a
///   keyhole. The headless intents are the ones that answer in a sentence.
@available(iOS 17.0, *)
@AssistantIntent(schema: .system.searchInApp)
struct RecipelySearchIntent: AppIntent {
  static let searchScopes: [StringSearchScope] = [.general]

  @Parameter(title: "Query")
  var criteria: StringSearchCriteria

  @MainActor
  func perform() async throws -> some IntentResult {
    RecipelyAssistantStore.enqueue([
      "id": "searchRecipes",
      "invocationId": UUID().uuidString,
      "action": "search",
      "arg": criteria.term,
      "at": Date().timeIntervalSince1970 * 1000,
    ])
    return .result()
  }
}
