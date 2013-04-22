( function(Dataflow) {

  var Source = Dataflow.prototype.plugin("source");

  Source.initialize = function(dataflow){

    var $form = $( 
      '<form class="dataflow-plugin-view-source" style="width: 330px;">'+
        '<textarea class="code" style="width: 100%; height: 400px;"></textarea><br/>'+
        '<input class="apply" type="submit" value="apply changes" />'+
      '</form>'
    );
    var $code = $form.children(".code");

    dataflow.addPlugin("view source", $form);

    // On change update code view
    dataflow.on("change", function(graph){
      if (dataflow.graph) {
        var scrollBackTop = $code.prop("scrollTop");
        $code.val( JSON.stringify(dataflow.graph.toJSON(), null, "  ") );
        $code.scrollTop( scrollBackTop );
      }
    });

    // Apply source to test graph
    $form.submit(function(){
      var graph;
      try {
        graph = JSON.parse( $code.val() );
      } catch(error){
        dataflow.log("Invalid JSON");
        return false;
      }
      if (graph) {
        var g = dataflow.loadGraph(graph);
        g.trigger("change");
      }
      return false;
    });
    
  };

}(Dataflow) );
