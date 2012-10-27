( function(Dataflow) {
 
  var template = 
    '<form id="source" style="width: 330px;">'+
      '<textarea id="code" style="width: 100%; height: 400px;"></textarea><br/>'+
      '<input id="apply" type="submit" value="apply changes" />'+
    '</form>';

  Dataflow.addPlugin("view source", template);

  // On change update code view
  Dataflow.on("change", function(graph){
    if (Dataflow.graph) {
      $("#code").val( JSON.stringify(Dataflow.graph.toJSON(), null, "  ") );
    }
  });

  // Apply source to test graph
  $("#source").submit(function(){
    var graph;
    try {
      graph = JSON.parse( $("#code").val() );
    } catch(error){
      Dataflow.log("Invalid JSON");
      return false;
    }
    if (graph) {
      var g = Dataflow.loadGraph(graph);
      g.trigger("change");
    }
    return false;
  });

}(Dataflow) );
