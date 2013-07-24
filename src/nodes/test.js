( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.prototype.node("base-resizable");
  var Test = Dataflow.prototype.node("test");

  Test.Model = BaseResizable.Model.extend({
    defaults: function(){
      var defaults = BaseResizable.Model.prototype.defaults.call(this);
      defaults.type = "test";
      defaults.w = 200;
      defaults.h = 400;
      return defaults;
    },
    inputinput: function(value){
      this.view.$inner.text(value);
    },
    inputstring: function(value){
      this.send("output", value + " test");
    },
    inputint: function(value){
      this.send("output", value);
    },
    inputfloat: function(value){
      this.send("output", value);
    },
    inputboolean: function(value){
      this.send("output", !value);
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
      },
      {
        id: "select",
        type: "string",
        options: "January February March April",
        value: "April"
      },
      {
        id: "select2",
        type: "int",
        min: 0,
        max: 3,
        options: {sine:0, square:1, saw: 2, triangle: 3}
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
    initialize: function(options){
      BaseResizable.View.prototype.initialize.call(this, options);
      this.$inner.text("view.$inner");
    }
  });

}(Dataflow) );
