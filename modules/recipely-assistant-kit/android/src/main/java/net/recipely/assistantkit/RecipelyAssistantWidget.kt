package net.recipely.assistantkit

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

/**
 * A home-screen button that opens the assistant.
 *
 * The third route to the same place, for the people who never open Quick
 * Settings. It has no state and no data: a widget that showed a recipe would
 * have to be refreshed, and a refresh that fails is a widget showing yesterday.
 * This one is a button, and a button cannot be stale.
 */
class RecipelyAssistantWidget : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val scheme = RecipelyAssistantConfig.scheme(context)
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("$scheme://$ASSISTANT_LINK"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    val pending = PendingIntent.getActivity(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.recipely_assistant_widget)
      views.setOnClickPendingIntent(R.id.recipely_widget_root, pending)
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  private companion object {
    /** The same link the tile and the `askRecipely` shortcut open. */
    const val ASSISTANT_LINK = "assistant/run?id=askRecipely"
    const val REQUEST_CODE = 1
  }
}
