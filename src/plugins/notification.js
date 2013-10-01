( function(Dataflow) {
  var Notification = Dataflow.prototype.plugin('notification');
  var webNotifications = window.webkitNotifications ? true : false;

  // Request permission to show notifications
  //
  // Note that this function has to be called from some user
  // interaction, like a click event.
  //
  // For example:
  //
  //     $button.click(function () {
  //       dataflow.plugins.notification.requestPermission();
  //       // Other things the button should do
  //     });
  Notification.requestPermission = function () {
    if (!webNotifications) {
      return;
    }

    if (Notification.hasPermission()) {
      // We already have the permission
      return;
    }

    window.webkitNotifications.requestPermission();
  };

  // Check if user has granted the permission to show Web Notifications
  Notification.hasPermission = function () {
    if (!webNotifications) {
      return false;
    }

    if (window.webkitNotifications.checkPermission() !== 0) {
      return false;
    }

    return true;
  };

  // Show a notification. If user has granted the permission to show
  // Web Notifications, then that is what will be used. Otherwise,
  // the notification will fall back to console.log
  Notification.notify = function (icon, title, message) {
    if (!Notification.hasPermission()) {
      if (!console || !console.log) {
        // TODO: alert?
        return;
      }
      console.log(title + ': ' + message);
      return;
    }
    var notification = window.webkitNotifications.createNotification(icon, title, message);
    notification.show();
  };

}(Dataflow) );
