( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.prototype.node("base");
  var BaseResizable = Dataflow.prototype.node("base-resizable");

  BaseResizable.Model = Base.Model.extend({
    defaults: function(){
      var defaults = Base.Model.prototype.defaults.call(this);
      defaults.type = "base-resizable";
      defaults.w = 200;
      defaults.h = 200;
      return defaults;
    },
    initialize: function() {
      Base.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json.w = this.get("w");
      json.h = this.get("h");
      return json;
    },
    inputs:[],
    outputs:[]
  });

  BaseResizable.View = Base.View.extend({
    initialize: function(options) {
      Base.View.prototype.initialize.call(this, options);
      // Initial size
      this.$el.css({
        width: this.model.get("w"),
        height: this.model.get("h")
      });
      // Make resizable
      var self = this;
      this.$el.resizable({
        helper: "dataflow-node helper",
        minHeight: 100,
        minWidth: 120,
        stop: function(event, ui) {
          self.resizeStop(event, ui);
        }
      });
      // The simplest way to extend the events hash
      // this.addEvents({
      //   'resizestop': 'resizeStop'
      // });
    },
    resizeStop: function(event, ui) {
      this.model.set({
        "w": ui.size.width,
        "h": ui.size.height
      });
    }
  });

}(Dataflow) );
