import XCTest

/// Runs "Ask Recipely" the way a user would, from the Shortcuts app, and records
/// what the system showed.
///
/// - Note: **Shortcuts, not Siri.** `XCUIDevice.siriService` opens the Siri
///   window on the iOS 26 simulator but never recognises the injected text, so
///   the phrase cannot be spoken here. The Shortcuts tile runs the same intent
///   through the same system prompt, which is what this checks.
/// - Note: **The icon, not the label.** Tapping the tile's title does nothing;
///   the button is named for its SF Symbol.
/// - Note: **Evidence, not assertions.** Every step leaves a screenshot and the
///   springboard's accessibility tree; `run.sh` prints the lines that matter.
final class AskRecipelyProbeTests: XCTestCase {
  private let shortcuts = XCUIApplication(bundleIdentifier: "com.apple.shortcuts")
  private let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")

  private func record(_ name: String) {
    let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    shot.name = name
    shot.lifetime = .keepAlways
    add(shot)
    let tree = XCTAttachment(string: springboard.debugDescription)
    tree.name = "\(name)-tree"
    tree.lifetime = .keepAlways
    add(tree)
  }

  func testAskRecipely() throws {
    let env = ProcessInfo.processInfo.environment
    let question = env["PROBE_QUESTION"] ?? "How many calories are in an egg?"
    let app = XCUIApplication(bundleIdentifier: env["PROBE_BUNDLE_ID"] ?? "net.recipely.app.dev")

    shortcuts.launch()
    let tile = shortcuts.buttons["bubble.left.and.text.bubble.right"].firstMatch
    XCTAssertTrue(tile.waitForExistence(timeout: 10), "the Ask Recipely tile is not in Shortcuts")
    // The tile labels are the app's own localized metadata; the prompt below is
    // the system's run-time context. Recording both is what separated them (D27).
    let tiles = XCTAttachment(string: shortcuts.staticTexts.allElementsBoundByIndex.map(\.label).joined(separator: " | "))
    tiles.name = "0-tiles"
    tiles.lifetime = .keepAlways
    add(tiles)
    tile.tap()

    let field = springboard.textFields.firstMatch
    XCTAssertTrue(field.waitForExistence(timeout: 10), "the follow-up question never appeared")
    record("1-prompt")
    field.tap()
    field.typeText(question)
    for label in ["Continue", "Devam"] where springboard.buttons[label].exists {
      springboard.buttons[label].firstMatch.tap()
    }
    record("2-typed")
    springboard.buttons.matching(NSPredicate(format: "label IN %@", ["Done", "Bitti", "OK", "Tamam"])).firstMatch.tap()

    // The answer arrives as a snippet with its own Done button; the prompt had one
    // too, so wait for the prompt's text field to go and a Done to come back.
    let started = Date()
    let done = springboard.buttons.matching(NSPredicate(format: "label IN %@", ["Done", "Bitti", "OK", "Tamam"])).firstMatch
    let proceed = springboard.buttons.matching(NSPredicate(format: "label IN %@", ["Continue", "Devam"])).firstMatch
    while Date().timeIntervalSince(started) < 45 {
      if !springboard.textFields.firstMatch.exists && (done.exists || proceed.exists) { break }
      sleep(1)
    }
    record("3-answer")
    // An answer that drives the app, or no answer at all, asks to continue in
    // the app. Accept, and see whether the app actually comes forward.
    if proceed.exists, env["PROBE_DECLINE"] == "1" {
      springboard.buttons.matching(NSPredicate(format: "label IN %@", ["Cancel", "Vazgeç"])).firstMatch.tap()
      sleep(3)
      record("4-declined")
    } else if proceed.exists {
      proceed.tap()
      _ = app.wait(for: .runningForeground, timeout: 15)
      record("4-came-forward")
    }
    let summary = XCTAttachment(string: "seconds=\(Int(Date().timeIntervalSince(started))) appState=\(app.state.rawValue)")
    summary.name = "summary"
    summary.lifetime = .keepAlways
    add(summary)
  }
}
