( function(Dataflow) {
 
  var $form = $( 
    '<form class="dataflow-plugin-view-source" style="width: 330px;">'+
      '<textarea class="code" style="width: 100%; height: 400px;"></textarea><br/>'+
      '<input class="apply" type="submit" value="apply changes" />'+
    '</form>'
  );
  var $code = $form.children(".code");

  Dataflow.addPlugin("view source", $form);

  // On change update code view
  Dataflow.on("change", function(graph){
    if (Dataflow.graph) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( JSON.stringify(Dataflow.graph.toJSON(), null, "  ") );
      $code.scrollTop( scrollBackTop );
    }
  });

  // Apply source to test graph
  $form.submit(function(){
    var graph;
    try {
      graph = JSON.parse( $code.val() );
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
