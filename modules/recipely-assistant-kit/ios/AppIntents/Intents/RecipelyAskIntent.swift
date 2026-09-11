import AppIntents
internal import RecipelyAssistantKit

/// "Ask Recipely" — then Siri asks what, and the assistant decides.
///
/// - Note: **The one entry with no fixed action.** Every other intent names a
///   word the registry already answers; this one hands a sentence to the
///   assistant and lets it choose. That is what makes it the whole of the in-app
///   assistant rather than a slice of it.
/// - Note: **Two turns, because Siri gives no other way.** A freeform `String`
///   inside an App Shortcut phrase is not recognised, so the phrase carries no
///   parameter and `requestValueDialog` makes Siri ask. See D1. What Siri says
///   comes from the `RecipelyIntents` table, generated from `osIntentDialogs` —
///   a bare literal here was spoken in English on every phone.
/// - Note: **It answers without opening the app when it can.** The narrow intent
///   token and the AES envelope let this process talk to the backend directly,
///   so a question with a spoken answer — "how many calories is this" — is
///   answered by Siri and nothing appears on screen.
/// - Note: **It comes forward when it must, and that is a decision not a
///   fallback.** An answer that names an action is an instruction to DRIVE the
///   app, and the actions drive screens: there is no draft, no scroll position
///   and no confirmation sheet in the process Siri launched. So the request is
///   queued and the app is brought up to run it. The same path serves a missing
///   token or a dead network, where opening the app is simply the thing that works.
/// - Note: **Queued before the app comes up; the app decides whether it is still
///   wanted.** The app drains the queue when it turns active, so a request
///   written after that moment would wait for the next launch. The catch below
///   withdraws it when coming forward throws, but that is best effort and was
///   measured to miss: Cancel on Siri's "continue in the app" never reached it,
///   and a process killed at that prompt never resumes. The guarantee is the
///   app's — `isStaleInvocation` drops a request nobody is waiting for.
/// - Note: **The system asks first.** On the simulator `continueInForeground`
///   showed "You'll need to continue in the app" even with `alwaysConfirm: false`
///   — that flag only skips the prompt after recent activity. See D26.
/// - Note: **Two APIs for one step.** `continueInForeground` exists from iOS 26
///   and can skip the confirmation; before it, `ForegroundContinuableIntent` is the
///   only way and always asks. The conformance is deprecated in 26, which warns
///   only once the deployment target reaches 26. On 26 the modes are declared
///   rather than left to the system to derive from that deprecated conformance:
///   without `.foreground(.dynamic)` every call to come forward would throw.
@available(iOS 17.2, *)
struct RecipelyAskIntent: AppIntent, ForegroundContinuableIntent {
  static let title: LocalizedStringResource = "Ask Recipely"
  static let description = IntentDescription("Asks the Recipely cooking assistant anything.")

  /// False on purpose: the point is to answer without a screen when possible.
  static let openAppWhenRun = false

  @available(iOS 26.0, *)
  static var supportedModes: IntentModes { [.background, .foreground(.dynamic)] }

  @Parameter(
    title: "Question",
    requestValueDialog: IntentDialog(LocalizedStringResource("What would you like to ask?", table: "RecipelyIntents"))
  )
  var question: String

  init() {}

  func perform() async throws -> some IntentResult & ProvidesDialog {
    guard let reply = await RecipelyAssistantClient.ask(question) else {
      try await comeForward(running: RecipelyRequest.enqueue(id: "askRecipely", action: nil, arg: question))
      return .result(dialog: Self.openingApp)
    }

    guard let action = reply.action else {
      return .result(dialog: IntentDialog(stringLiteral: reply.text))
    }

    try await comeForward(running: RecipelyRequest.enqueue(id: "askRecipely", action: action, arg: reply.arg))
    return .result(dialog: reply.text.isEmpty ? Self.openingApp : IntentDialog(stringLiteral: reply.text))
  }

  /// An answer that acts usually says nothing — measured against dev, a search
  /// came back with empty text — so the line is ours rather than a blank one.
  private static var openingApp: IntentDialog {
    IntentDialog(LocalizedStringResource("Opening Recipely.", table: "RecipelyIntents"))
  }

  private func comeForward(running invocationId: String) async throws {
    do {
      if #available(iOS 26.0, *) {
        try await continueInForeground(alwaysConfirm: false)
      } else {
        try await requestToContinueInForeground()
      }
    } catch {
      RecipelyRequest.withdraw(invocationId)
      throw error
    }
  }
}
