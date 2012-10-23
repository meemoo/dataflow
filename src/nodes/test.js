/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var Test = Dataflow.node("test");

  Test.Model = BaseResizable.Model.extend({
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
      },
      {
        id: "output2",
        type: "all"
      }
    ]
  });

  Test.View = BaseResizable.View.extend({
  });

}(Dataflow) );
