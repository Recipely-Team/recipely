import ExpoModulesCore

/// The JavaScript face of the shared container.
///
/// - Note: **This module never performs an action.** It hands invocations up to
///   `AssistantActionRegistry`, which is the one thing that knows how to run a
///   word, and takes the app's recipe catalogue down. Putting dispatch here
///   would have meant a second implementation of the vocabulary, in a language
///   with no access to the screens the handlers drive.
/// - Note: **`onInvocation` fires only for a running app.** The cold-launch case
///   is the queue, not the event: by the time a listener could be attached the
///   intent has long since run.
public final class RecipelyAssistantKitModule: Module {
  static let invocationEvent = "onInvocation"
  /// The catalogue kind the app publishes recipes under; `OsAssistantBridge` spells the same word.
  static let recipeEntityKind = "recipe"

  public func definition() -> ModuleDefinition {
    Name("RecipelyAssistantKit")

    Events(Self.invocationEvent)

    Property("isAvailable") {
      RecipelyAssistantStore.appGroupIdentifier != nil
    }

    AsyncFunction("getPendingInvocationsAsync") { () -> [[String: Any]] in
      RecipelyAssistantStore.pendingInvocations()
    }

    AsyncFunction("removePendingInvocationAsync") { (invocationId: String) in
      RecipelyAssistantStore.removeInvocation(invocationId: invocationId)
    }

    AsyncFunction("clearPendingInvocationsAsync") {
      RecipelyAssistantStore.clearInvocations()
    }

    AsyncFunction("setEntityCatalogAsync") { (kind: String, entries: [[String: Any]]) in
      RecipelyAssistantStore.setEntities(kind: kind, entries: entries)
      // The same list, in the one place iOS looks when someone searches their
      // phone rather than naming the app. Apple requires the app's name in
      // every Siri phrase, so Spotlight is the only surface where "baklava"
      // alone can reach us.
      if kind == RecipelyAssistantKitModule.recipeEntityKind, #available(iOS 15.1, *) {
        RecipelySpotlightIndex.publish(entries)
      }
    }

    // iOS publishes its entity catalogue through the shared container, which
    // `setEntityCatalogAsync` has already written; the Shortcuts phrases are
    // static. Android is where this does real work.
    AsyncFunction("refreshShortcutsAsync") {
      // Intentionally empty on iOS.
    }

    AsyncFunction("setCredentialsAsync") { (credentials: [String: Any]) in
      RecipelyAssistantStore.setCredentials(
        token: credentials["token"] as? String,
        languageCode: credentials["languageCode"] as? String ?? "en"
      )
    }
  }
}
