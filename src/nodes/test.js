/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var Test = Dataflow.node("test");

  Test.Model = BaseResizable.Model.extend({
    defaults: function(){
      var defaults = BaseResizable.Model.prototype.defaults.call(this);
      defaults.type = "test";
      defaults.w = 200;
      defaults.h = 400;
      return defaults;
    },
    inputs:[
      {
        id: "input",
        type: "all"
      },
      {
        id: "string",
        type: "string"
      },
      {
        id: "int",
        type: "int"
      },
      {
        id: "float",
        type: "float"
      },
      {
        id: "boolean",
        type: "boolean"
      },
      {
        id: "bang",
        type: "bang"
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
