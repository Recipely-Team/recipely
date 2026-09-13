import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

/// Puts the user's own recipes where iOS looks when they search their phone.
///
/// - Note: **Why this is the only surface that works without the app's name.**
///   Apple requires `\(.applicationName)` in every App Shortcut phrase, so
///   "baklava tarifi bul" said to Siri can never reach a third-party app. What
///   CAN reach it is Spotlight: a recipe indexed here is found by typing or
///   dictating its name into search, and opens straight to it.
/// - Note: **The catalogue is replaced, never merged.** `setEntities` hands over
///   the whole list every time, so the domain is emptied first. Signing out
///   publishes an empty list — and this is what makes that mean something: the
///   previous person's recipe titles must not be readable out of Spotlight by
///   whoever holds the phone next.
/// - Note: **`CSSearchableItem`, not `IndexedEntity`.** The App Intents entity
///   lives in the app target and indexing it needs a call this app has nowhere
///   to make (see D20 on the board). Core Spotlight has no such requirement and
///   runs perfectly well from the pod.
@available(iOS 15.1, *)
public enum RecipelySpotlightIndex {
  /// One domain, so replacing the catalogue is a single delete.
  public static let domainIdentifier = "net.recipely.recipes"
  private static let idPrefix = "recipe:"
  /// What a URL may carry as-is (RFC 3986 unreserved). Wider sets let `&` and
  /// `?` through, which would end the argument early; `.alphanumerics` alone
  /// escapes the hyphen every backend id contains.
  private static let unreserved = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-._~"))

  /// The recipe a Spotlight result stands for, or nil when it is not one of ours.
  public static func recipeId(fromSearchableItemIdentifier identifier: String) -> String? {
    guard identifier.hasPrefix(idPrefix) else { return nil }
    return String(identifier.dropFirst(idPrefix.count))
  }

  /// The link a tapped result opens — the SAME one Android's shortcuts use.
  ///
  /// Not `<scheme>://recipes/<id>`: the app receives OS requests on one road,
  /// `assistant/run`, which `+native-intent.tsx` parses and the action registry
  /// dispatches. A second shape would be a second way in, tested nowhere, and
  /// it would skip everything `openRecipe` knows about finding a recipe.
  public static func recipeURL(recipeId: String, scheme: String) -> URL? {
    guard !scheme.isEmpty,
          let encoded = recipeId.addingPercentEncoding(withAllowedCharacters: Self.unreserved),
          !encoded.isEmpty
    else {
      return nil
    }
    return URL(string: "\(scheme)://assistant/run?id=openRecipe&action=openRecipe&arg=\(encoded)")
  }

  public static func publish(_ entries: [[String: Any]]) {
    let index = CSSearchableIndex.default()
    index.deleteSearchableItems(withDomainIdentifiers: [domainIdentifier]) { _ in
      let items = entries.compactMap(searchableItem)
      guard !items.isEmpty else { return }
      index.indexSearchableItems(items) { _ in }
    }
  }

  private static func searchableItem(from entry: [String: Any]) -> CSSearchableItem? {
    guard let id = entry["id"] as? String, let title = entry["title"] as? String else { return nil }

    let attributes = CSSearchableItemAttributeSet(contentType: UTType.content)
    attributes.title = title
    attributes.contentDescription = entry["subtitle"] as? String
    // The words someone would actually type: the title's own, plus the one word
    // that says which app this came from.
    attributes.keywords = title.split(separator: " ").map(String.init) + ["Recipely"]

    return CSSearchableItem(
      uniqueIdentifier: idPrefix + id,
      domainIdentifier: domainIdentifier,
      attributeSet: attributes
    )
  }
}
