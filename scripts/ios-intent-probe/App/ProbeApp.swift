import SwiftUI

/// The UI-test target needs a host; it never drives this app, only Shortcuts.
@main
struct ProbeApp: App {
  var body: some Scene { WindowGroup { Text("intent probe") } }
}
