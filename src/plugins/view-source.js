( function(Dataflow) {

  var Source = Dataflow.prototype.plugin("source");

  Source.initialize = function(dataflow){

    var $form = $( 
      '<form class="dataflow-plugin-view-source">'+
        '<div style="">'+
          '<textarea class="code" style="width:99%; height:400px;; margin:0; padding: 0;"></textarea><br/>'+
        '</div>'+
        '<input class="apply" type="submit" value="apply changes" style="position: absolute; right:5px; bottom:5px;" />'+
      '</form>'
    );
    var $code = $form.find(".code");

    $code.keydown(function(event){
      event.stopPropagation();
    });

    dataflow.addPlugin({
      id: "source", 
      name: "", 
      menu: $form, 
      icon: "cog"
    });

    var show = function(source) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( source );
      $code.scrollTop( scrollBackTop );
    };

    Source.show = show;

    var showGraph = function(graph){
      if (dataflow.graph) {
        show( JSON.stringify(dataflow.graph.toJSON(), null, "  ") );
      }
    };

    Source.listeners = function(boo){
      if (boo) {
        // On change update code view
        dataflow.on("change", showGraph);
      } else {
        // Custom
        dataflow.off("change", showGraph);
      }
    };
    Source.listeners(true);

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
