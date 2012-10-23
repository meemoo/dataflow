/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var Base = Dataflow.node("base");

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
      // {
      //   id: "input",
      //   type: "all"
      // }
    ],
    outputs:[
    ]
  });

  BaseResizable.View = Base.View.extend({
    initialize: function() {
      Base.View.prototype.initialize.call(this);
      // Initial size
      this.$el.css({
        left: this.model.get("w"),
        top: this.model.get("h")
      });
      // Make resizable
      var self = this;
      this.$el.resizable({
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="node helper" style="width:'+width+'px; height:'+height+'px">');
        },
        stop: self.resizeStop
      });
    },
    resizeStop: function(event, ui) {
      console.log();
    }
  });

}(Dataflow) );
