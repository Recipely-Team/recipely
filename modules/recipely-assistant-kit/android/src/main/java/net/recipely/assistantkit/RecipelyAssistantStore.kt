package net.recipely.assistantkit

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * The one place the app and its OS entry points exchange state.
 *
 * The Android counterpart of `RecipelyAssistantStore.swift`, and deliberately
 * the same shape. Android has no App Group: a shortcut, a tile and an
 * AppFunction all run inside this app's own process, so ordinary private
 * preferences already are the shared container — there is nothing to widen and
 * nothing to leak.
 *
 * The queue is not consumed by reading it. JavaScript removes an entry once it
 * has dispatched the action, because a read that drained the queue would lose
 * the request whenever the process died in between.
 */
object RecipelyAssistantStore {
  private const val PREFS = "recipely.assistant"
  private const val QUEUE_KEY = "invocationQueue"
  private const val ENTITY_KEY_PREFIX = "entities."
  private const val TOKEN_KEY = "token"
  private const val LANGUAGE_KEY = "language"

  /** A to-do list for the next launch, not a history. */
  private const val QUEUE_LIMIT = 16

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun enqueue(context: Context, invocation: JSONObject) {
    val queue = readArray(context, QUEUE_KEY)
    queue.put(invocation)
    val trimmed = JSONArray()
    val from = maxOf(0, queue.length() - QUEUE_LIMIT)
    for (i in from until queue.length()) trimmed.put(queue.get(i))
    prefs(context).edit().putString(QUEUE_KEY, trimmed.toString()).apply()
  }

  fun pendingInvocations(context: Context): JSONArray = readArray(context, QUEUE_KEY)

  fun removeInvocation(context: Context, invocationId: String) {
    val queue = readArray(context, QUEUE_KEY)
    val kept = JSONArray()
    for (i in 0 until queue.length()) {
      val entry = queue.optJSONObject(i) ?: continue
      if (entry.optString("invocationId") != invocationId) kept.put(entry)
    }
    prefs(context).edit().putString(QUEUE_KEY, kept.toString()).apply()
  }

  fun clearInvocations(context: Context) {
    prefs(context).edit().remove(QUEUE_KEY).apply()
  }

  fun setEntities(context: Context, kind: String, entries: JSONArray) {
    prefs(context).edit().putString(ENTITY_KEY_PREFIX + kind, entries.toString()).apply()
  }

  fun entities(context: Context, kind: String): JSONArray =
    readArray(context, ENTITY_KEY_PREFIX + kind)

  fun setCredentials(context: Context, token: String?, languageCode: String) {
    prefs(context).edit()
      .apply { if (token == null) remove(TOKEN_KEY) else putString(TOKEN_KEY, token) }
      .putString(LANGUAGE_KEY, languageCode)
      .apply()
  }

  fun token(context: Context): String? = prefs(context).getString(TOKEN_KEY, null)

  fun languageCode(context: Context): String =
    prefs(context).getString(LANGUAGE_KEY, null) ?: "en"

  private fun readArray(context: Context, key: String): JSONArray {
    val raw = prefs(context).getString(key, null) ?: return JSONArray()
    return runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
  }
}
