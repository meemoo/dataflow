( function(Dataflow) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Base = Dataflow.node("base");

  Base.Model = Node.Model.extend({
    defaults: {
      label: "",
      type: "base",
      x: 200,
      y: 100
    },
    initialize: function() {
      Node.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
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

  Base.View = Node.View.extend({
  });

}(Dataflow) );
