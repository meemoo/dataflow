( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowOutput = Dataflow.node("dataflow-output");

  DataflowOutput.Model = Base.Model.extend({
    defaults: {
      label: "output",
      type: "dataflow-output",
      x: 200,
      y: 100,
      "output-type": "all"
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json["output-type"] = this.get("output-type");
      return json;
    },
    inputs:[
      {
        id: "data",
        type: "all"
      }
    ],
    outputs:[
      // {
      //   id: "data",
      //   type: "all"
      // }
    ]
  });

  // DataflowInput.View = Base.View.extend({
  // });

}(Dataflow) );
