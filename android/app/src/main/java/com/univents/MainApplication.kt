package com.univents

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    val packages = PackageList(this).packages.apply {
      if (none { it is ReactNativeFirebaseAppPackage }) add(ReactNativeFirebaseAppPackage())
      if (none { it is ReactNativeFirebaseMessagingPackage }) add(ReactNativeFirebaseMessagingPackage())
    }
    getDefaultReactHost(
      context = applicationContext,
      packageList = packages,
    )
  }

  override fun onCreate() {
    super.onCreate()
    createEventNotificationChannel()
    loadReactNative(this)
  }

  private fun createEventNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        getString(R.string.event_notification_channel_id),
        getString(R.string.event_notification_channel_name),
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = getString(R.string.event_notification_channel_description)
        enableVibration(true)
        setSound(
          RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
      }
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
  }
}
