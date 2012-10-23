/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var Node = Dataflow.module("node");

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

  Base.View = Node.Views.Main.extend({
  });

}(Dataflow) );
