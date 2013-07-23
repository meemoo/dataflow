(function(Dataflow) {
  var StateModel = Backbone.Model.extend({});

  Dataflow.prototype.loadState = function () {
    // Initialize State with localStorage
    var stateKey = 'dataflow-' + (this.id ? this.id : this.cid);
    var stateData = JSON.parse(window.localStorage.getItem(stateKey));
    if (!stateData) {
      stateData = {};
    }

    var state = new StateModel(stateData);
    this.set('state', state);

    // Set up persistence
    state.on('change', function (stateInstance) {
      window.localStorage.setItem(stateKey, JSON.stringify(stateInstance.toJSON()));
    });
  };

}(Dataflow));
