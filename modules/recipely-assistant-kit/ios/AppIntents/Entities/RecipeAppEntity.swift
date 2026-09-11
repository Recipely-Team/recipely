import AppIntents
import Foundation
internal import RecipelyAssistantKit

/// A recipe as Siri and Spotlight know it.
///
/// - Note: **Resolved from disk, never from the API.** An intent runs with no
///   session and often no network, so the only recipes the user can name out
///   loud are the ones the app has already written to the shared container.
///   `useOsEntityCatalogueSync` is what puts them there, and it publishes
///   nothing at all once the user signs out.
/// - Note: **`subtitle` is the cuisine, and may be absent.** It is shown under
///   the title when Siri disambiguates between two similar names, which is the
///   only reason it is carried at all.
@available(iOS 17.2, *)
struct RecipeAppEntity: AppEntity, Identifiable {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: LocalizedStringResource("Recipe", table: "RecipelyIntents"))
  static let defaultQuery = RecipeEntityQuery()

  let id: String
  let title: String
  let subtitle: String?

  var displayRepresentation: DisplayRepresentation {
    if let subtitle {
      return DisplayRepresentation(title: "\(title)", subtitle: "\(subtitle)")
    }
    return DisplayRepresentation(title: "\(title)")
  }

  /// Reads one catalogue row, or `nil` when it is not shaped like one.
  init?(row: [String: Any]) {
    guard let id = row["id"] as? String, !id.isEmpty,
          let title = row["title"] as? String, !title.isEmpty
    else { return nil }
    self.id = id
    self.title = title
    let subtitle = row["subtitle"] as? String
    self.subtitle = (subtitle?.isEmpty ?? true) ? nil : subtitle
  }
}
