( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var BaseResizable = Dataflow.node("base-resizable");

  BaseResizable.Model = Base.Model.extend({
    defaults: {
      label: "",
      type: "base-resizable",
      x: 200,
      y: 100,
      w: 200,
      h: 200
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
    inputs:[
    ],
    outputs:[
    ]
  });

  BaseResizable.View = Base.View.extend({
    initialize: function() {
      Base.View.prototype.initialize.call(this);
      // Initial size
      this.$el.css({
        width: this.model.get("w"),
        height: this.model.get("h")
      });
      // Make resizable
      var self = this;
      this.$el.resizable({
        helper: "node helper",
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
      // Triggers edge redraw
      this.model.trigger("move", this.model);
    }
  });

}(Dataflow) );
