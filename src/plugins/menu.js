(function (Dataflow) {
  var Menu = Dataflow.prototype.plugin('menu');
  var MenuCard = Dataflow.prototype.module('menucard');

  Menu.initialize = function (dataflow) {
    Menu.card = new MenuCard.Model({
      dataflow: dataflow,
      pinned: true
    });
    Menu.card.view = new MenuCard.View({
      model: Menu.card
    });

    Menu.addPlugin = function (info) {
      Menu.card.menu.add({
        id: info.id,
        icon: info.icon,
        label: info.label,
        showLabel: false,
        action: function () {
          Menu.card.hide();
          dataflow.showPlugin(info.id);
        }
      });
    };

    Menu.disablePlugin = function (name) {
      if (!this.card.menu.get(name)) {
        return;
      }
      this.card.menu.remove(name);

      if (dataflow.plugins[name] && dataflow.plugins[name].card) {
        // Hide any open cards from the plugin
        dataflow.plugins[name].card.hide();
      }
    };
  };
}(Dataflow));
