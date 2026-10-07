package net.recipely.windowposture

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

private const val POSTURE_EVENT = "onPostureChange"
private const val ORIENTATION_VERTICAL = "vertical"
private const val ORIENTATION_HORIZONTAL = "horizontal"
private const val STATE_FLAT = "flat"
private const val STATE_HALF_OPENED = "halfOpened"

/**
 * Publishes the fold or hinge crossing the activity window to JavaScript.
 *
 * Collects `WindowInfoTracker.windowLayoutInfo` inside `repeatOnLifecycle(STARTED)`,
 * so the flow runs only while the activity is visible and is cancelled with its
 * lifecycle scope; a recreated activity restarts it on the next foreground. The
 * last value is kept for the synchronous `getPosture`, and every change is sent
 * as `onPostureChange`. Bounds arrive in window pixels and leave in dp, the unit
 * React Native lays out in.
 */
class RecipelyWindowPostureModule : Module() {
  @Volatile private var latest: Map<String, Any>? = null
  private var job: Job? = null

  override fun definition() = ModuleDefinition {
    Name("RecipelyWindowPosture")

    Events(POSTURE_EVENT)

    Function("getPosture") { latest }

    OnCreate { startCollecting() }

    OnActivityEntersForeground { startCollecting() }

    OnDestroy { stopCollecting() }
  }

  // Synchronized: OnCreate and the first foreground can arrive together on different threads.
  @Synchronized
  private fun stopCollecting() {
    job?.cancel()
    job = null
  }

  @Synchronized
  private fun startCollecting() {
    if (job?.isActive == true) return
    val activity = appContext.currentActivity ?: return
    val owner = activity as? LifecycleOwner ?: return
    val tracker = WindowInfoTracker.getOrCreate(activity)
    job = owner.lifecycleScope.launch {
      owner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        tracker.windowLayoutInfo(activity).collect { info ->
          publish(toPayload(info, activity.resources.displayMetrics.density))
        }
      }
    }
  }

  private fun publish(posture: Map<String, Any>?) {
    if (posture == latest) return
    latest = posture
    sendEvent(POSTURE_EVENT, mapOf("posture" to posture))
  }

  private fun toPayload(info: WindowLayoutInfo, density: Float): Map<String, Any>? {
    val fold = info.displayFeatures.filterIsInstance<FoldingFeature>().firstOrNull() ?: return null
    val bounds = fold.bounds
    return mapOf(
      "isSeparating" to fold.isSeparating,
      "orientation" to
        if (fold.orientation == FoldingFeature.Orientation.VERTICAL) ORIENTATION_VERTICAL else ORIENTATION_HORIZONTAL,
      "state" to if (fold.state == FoldingFeature.State.HALF_OPENED) STATE_HALF_OPENED else STATE_FLAT,
      "x" to bounds.left / density,
      "y" to bounds.top / density,
      "width" to bounds.width() / density,
      "height" to bounds.height() / density,
    )
  }
}
