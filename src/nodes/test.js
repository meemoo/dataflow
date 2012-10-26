/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var Test = Dataflow.node("test");

  Test.Model = BaseResizable.Model.extend({
    defaults: {
      label: "",
      type: "test",
      x: 200,
      y: 100,
      w: 200,
      h: 200
    },
    inputs:[
      {
        id: "input",
        type: "all"
      },
      {
        id: "input2",
        type: "all"
      }
    ],
    outputs:[
      {
        id: "output",
        type: "all"
      }
    ]
  });

  Test.View = BaseResizable.View.extend({
    initialize: function(){
      BaseResizable.View.prototype.initialize.call(this);
      this.$(".inner").text("the node view .inner div can be used for info, ui, etc...");
    }
  });

}(Dataflow) );
