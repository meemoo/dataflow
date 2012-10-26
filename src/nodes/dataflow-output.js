( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowOutput = Dataflow.node("dataflow-output");

  DataflowOutput.Model = Base.Model.extend({
    defaults: {
      label: "output",
      type: "dataflow-output",
      x: 200,
      y: 100
    },
    inputs:[
      {
        id: "data",
        type: "all"
      },
      {
        id: "id",
        type: "string"
      },
      {
        id: "type",
        type: "string",
        defaultValue: "all"
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
