import ExpoModulesCore
import UIKit

private let postureEvent = "onPostureChange"

/// Publishes the fold crossing the app's window to JavaScript — the iOS half of the module whose
/// Android half reads Jetpack WindowManager. Same payload, so the TypeScript adapter does not know
/// which platform answered.
///
/// - The fold is UIKit's **division reserved region** (iOS 27.1): "a region where an element should
///   divide into two separate regions". Its frame, in window points (React Native's unit), is the
///   hinge; an active region means the window is split in two — `isSeparating`.
/// - **`UIHingeInteraction`** on the window reports the hinge opening and closing; a probe view laid
///   out with the window catches rotation and resizing. Either re-reads the region.
/// - **Compiled only against an SDK that has the API** (UIKit 9127.0.85, the iOS 27.1 SDK). Built with
///   an older SDK, or run below iOS 27.1, the module still loads and answers "no fold".
public final class RecipelyWindowPostureModule: Module {
  private let lock = NSLock()
  private var latest: [String: Any]?
  private var tracker: AnyObject?

  public func definition() -> ModuleDefinition {
    Name("RecipelyWindowPosture")

    Events(postureEvent)

    Function("getPosture") { () -> [String: Any]? in
      self.lock.lock()
      defer { self.lock.unlock() }
      return self.latest
    }

    OnCreate {
      DispatchQueue.main.async { self.startTracking() }
    }

    // Not OnAppEntersForeground: a cold start never "enters" the foreground, and at OnCreate the
    // key window may not exist yet. Becoming active covers both; a running tracker makes it a no-op.
    OnAppBecomesActive {
      DispatchQueue.main.async { self.startTracking() }
    }

    OnDestroy {
      DispatchQueue.main.async { self.tracker = nil }
    }
  }

  private func publish(_ posture: [String: Any]?) {
    lock.lock()
    let changed = (posture == nil) != (latest == nil) || !NSDictionary(dictionary: posture ?? [:]).isEqual(to: latest ?? [:])
    latest = posture
    lock.unlock()
    if changed {
      sendEvent(postureEvent, ["posture": posture.map { $0 as Any } ?? NSNull()])
    }
  }

  private func startTracking() {
    #if canImport(UIKit, _version: 9127.0.85)
    guard #available(iOS 27.1, *), tracker == nil, let window = keyWindow() else { return }
    tracker = HingeTracker(window: window) { [weak self] posture in self?.publish(posture) }
    #endif
  }

  private func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow)
  }
}

#if canImport(UIKit, _version: 9127.0.85)
/// Owns the hinge interaction and the layout probe for one window; dropping it removes both.
@available(iOS 27.1, *)
private final class HingeTracker {
  private weak var window: UIWindow?
  private var interaction: UIHingeInteraction?
  private let probe: LayoutProbe
  private var status: UIHinge.Status = .unknown
  private let onChange: ([String: Any]?) -> Void

  init(window: UIWindow, onChange: @escaping ([String: Any]?) -> Void) {
    self.window = window
    self.onChange = onChange
    probe = LayoutProbe(frame: window.bounds)
    let interaction = UIHingeInteraction { [weak self] _, update in
      self?.status = update.hinge?.status ?? .unknown
      self?.read()
    }
    self.interaction = interaction
    window.addInteraction(interaction)
    probe.onLayout = { [weak self] in self?.read() }
    window.addSubview(probe)
    read()
  }

  deinit {
    probe.removeFromSuperview()
    if let interaction { window?.removeInteraction(interaction) }
  }

  private func read() {
    guard let window else { return }
    onChange(posture(in: window))
  }

  private func posture(in window: UIWindow) -> [String: Any]? {
    guard let fold = window.reservedRegions(kind: .division).first(where: \.isActive) else { return nil }
    let frame = fold.frame
    return [
      "isSeparating": true,
      "orientation": frame.height >= frame.width ? "vertical" : "horizontal",
      "state": status == .partiallyOpen ? "halfOpened" : "flat",
      "x": frame.origin.x,
      "y": frame.origin.y,
      "width": frame.width,
      "height": frame.height,
    ]
  }
}

/// An invisible, non-interactive view that stretches with the window and reports each layout pass,
/// so a rotation or a resized window re-reads the fold. Hidden from accessibility.
private final class LayoutProbe: UIView {
  var onLayout: () -> Void = {}

  override init(frame: CGRect) {
    super.init(frame: frame)
    autoresizingMask = [.flexibleWidth, .flexibleHeight]
    isUserInteractionEnabled = false
    isAccessibilityElement = false
    accessibilityElementsHidden = true
    backgroundColor = .clear
  }

  required init?(coder: NSCoder) { nil }

  override func layoutSubviews() {
    super.layoutSubviews()
    onLayout()
  }
}
#endif
