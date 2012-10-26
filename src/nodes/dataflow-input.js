( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.node("base");
  var DataflowInput = Dataflow.node("dataflow-input");

  DataflowInput.Model = Base.Model.extend({
    defaults: {
      label: "input",
      type: "dataflow-input",
      x: 200,
      y: 100
    },
    inputs:[
      // {
      //   id: "data",
      //   type: "all"
      // },
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
      {
        id: "data",
        type: "all"
      }
    ]
  });

  // DataflowInput.View = Base.View.extend({
  // });

}(Dataflow) );
