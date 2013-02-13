( function(Dataflow) {

  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  // Output extends input
  Output.Model = Input.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all",
      description: ""
    },
    send: function(value){
      for (var i=0; i<this.connected.length; i++){
        var edge = this.connected[i];
        var targetNode = edge.target.parentNode;
        var name = edge.target.id;
        if (targetNode["input"+name]){
          // function defined, call it with value
          targetNode["input"+name](value);
        } else {
          // no function defined, set variable
          targetNode["_"+name] = value;
        }
      }
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow) );
