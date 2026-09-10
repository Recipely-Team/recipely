import AppIntents
import Foundation
internal import RecipelyAssistantKit

/// Phase 0's proof intent: search, on the one protocol that carries free text.
///
/// - Note: **`ShowInAppSearchResultsIntent` is how an arbitrary sentence reaches
///   the app at all.** Siri refuses a freeform `String` parameter inside an App
///   Shortcut phrase — only enums and entities are recognised there — but this
///   protocol is handed Siri's raw query in `criteria.term`. It is the only
///   single-turn path for a sentence on this SDK. See
///   docs/os-assistants-plan.md findings D1 and D12.
/// - Note: **It opens the app, and not by our choice.** The protocol's own
///   `openAppWhenRun` is `true`: a search shows a list the user scrolls, and
///   answering it in a Siri snippet would be showing a feed through a keyhole.
/// - Note: **The import is explicitly `internal`.** Swift 6 refuses an implicit
///   access level for a module that is imported as internal elsewhere in the
///   target, and Expo's generated modules provider imports this one.
@available(iOS 17.2, *)
struct RecipelySearchIntent: ShowInAppSearchResultsIntent {
  static let title: LocalizedStringResource = "Search Recipely"
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
