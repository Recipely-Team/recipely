import AppIntents
import Foundation
internal import RecipelyAssistantKit

/// Answers "which recipe?" for Siri, the Shortcuts editor and Spotlight.
///
/// - Note: **String matching is diacritic- and case-insensitive.** The names
///   this catalogue holds are Turkish as often as not, and a user saying
///   "kofte" for a recipe stored as "Köfte" is not making a mistake. Folding is
///   done with the current locale rather than a fixed one, because the same
///   letters fold differently in Turkish — a locale-less `lowercased()` turns
///   `I` into `i` where Turkish wants `ı`.
/// - Note: **`suggestedEntities` is what the Shortcuts editor shows** before the
///   user has typed anything, so it is the catalogue in the order the app
///   published it — saved recipes first, since those are the ones someone comes
///   back to.
@available(iOS 17.2, *)
struct RecipeEntityQuery: EntityStringQuery {
  private static let entityKind = "recipe"

  func entities(for identifiers: [String]) async throws -> [RecipeAppEntity] {
    let wanted = Set(identifiers)
    return catalogue().filter { wanted.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [RecipeAppEntity] {
    let needle = fold(string)
    guard !needle.isEmpty else { return catalogue() }
    return catalogue().filter { fold($0.title).contains(needle) }
  }

  func suggestedEntities() async throws -> [RecipeAppEntity] {
    catalogue()
  }

  private func catalogue() -> [RecipeAppEntity] {
    RecipelyAssistantStore.entities(kind: Self.entityKind).compactMap(RecipeAppEntity.init(row:))
  }

  private func fold(_ text: String) -> String {
    text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }
}
