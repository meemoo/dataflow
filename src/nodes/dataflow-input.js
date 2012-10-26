( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowInput = Dataflow.node("dataflow-input");

  DataflowInput.Model = Base.Model.extend({
    defaults: {
      label: "input",
      type: "dataflow-input",
      x: 200,
      y: 100,
      "input-type": "all"
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json["input-type"] = this.get("input-type");
      return json;
    },
    inputs:[
      // {
      //   id: "data",
      //   type: "all"
      // },
    ],
    outputs:[
      {
        id: "data",
        type: "all"
      }
    ]
  });

  // DataflowInput.View = Base.View.extend({
  // });

}(Dataflow) );
