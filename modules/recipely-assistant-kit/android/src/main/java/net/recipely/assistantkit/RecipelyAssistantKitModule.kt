package net.recipely.assistantkit

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

/**
 * The JavaScript face of the shared store.
 *
 * Mirrors `RecipelyAssistantKitModule.swift` method for method, so a call site
 * never asks which platform it is on. This module never performs an action: it
 * hands invocations up to `AssistantActionRegistry`, the one thing that knows
 * how to run a word, and takes the app's recipe catalogue down.
 */
class RecipelyAssistantKitModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RecipelyAssistantKit")

    Events(INVOCATION_EVENT)

    Property("isAvailable") { true }

    AsyncFunction("getPendingInvocationsAsync") {
      toMaps(RecipelyAssistantStore.pendingInvocations(context))
    }

    AsyncFunction("removePendingInvocationAsync") { invocationId: String ->
      RecipelyAssistantStore.removeInvocation(context, invocationId)
    }

    AsyncFunction("clearPendingInvocationsAsync") {
      RecipelyAssistantStore.clearInvocations(context)
    }

    AsyncFunction("setEntityCatalogAsync") { kind: String, entries: List<Map<String, Any?>> ->
      RecipelyAssistantStore.setEntities(context, kind, toJsonArray(entries))
    }

    AsyncFunction("refreshShortcutsAsync") {
      RecipelyShortcutPublisher.publish(context)
    }

    AsyncFunction("setCredentialsAsync") { credentials: Map<String, Any?> ->
      RecipelyAssistantStore.setCredentials(
        context,
        credentials["token"] as? String,
        credentials["languageCode"] as? String ?: "en",
      )
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext) { "React context is unavailable" }

  private fun toMaps(array: JSONArray): List<Map<String, Any?>> =
    (0 until array.length()).mapNotNull { index ->
      array.optJSONObject(index)?.let { entry ->
        entry.keys().asSequence().associateWith { key -> entry.get(key) }
      }
    }

  private fun toJsonArray(entries: List<Map<String, Any?>>): JSONArray =
    JSONArray().apply { entries.forEach { put(JSONObject(it)) } }

  private companion object {
    const val INVOCATION_EVENT = "onInvocation"
  }
}
