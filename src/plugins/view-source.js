( function(Dataflow) {

  var Source = Dataflow.prototype.plugin("source");

  // Whether the graph may be updated via the source form
  Source.updateAllowed = true;

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

    dataflow.addPlugin({
      id: "source", 
      label: "view source",
      name: "", 
      menu: $form, 
      icon: "code",
      pinned: true
    });

    Source.show = function(source) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( source );
      $code.scrollTop( scrollBackTop );
    };

    var showGraph = function(graph){
      if (dataflow.graph) {
        Source.show( JSON.stringify(dataflow.graph.toJSON(), null, "  ") );
      }
    };

    // Method for setting graph change listeners on or off
    Source.listeners = function(boo){
      if (boo) {
        // On change update code view
        dataflow.on("change", showGraph);
      } else {
        // Custom
        dataflow.off("change", showGraph);
      }
    };
    // By default we listen to graph changes
    Source.listeners(true);

    // Whether to allow updating the graph from the form
    Source.allowUpdate = function (allowed) {
      var $button = $form.find('.apply');
      if (allowed) {
        Source.updateAllowed = true;
        $button.show();
        $code.removeAttr('readonly');
        return;
      }
      Source.updateAllowed = false;
      $button.hide();
      $code.attr('readonly', 'readonly');
    };

    // Apply source to test graph
    $form.submit(function(){
      Source.updateGraph($code, dataflow);
      return false;
    });
    
  };

  // Method for updating the graph from the form. Override
  // this for systems using another graph format (for example,
  // NoFlo).
  Source.updateGraph = function ($code, dataflow) {
    if (!Source.updateAllowed) {
      return;
    }
    var graph;
    try {
      graph = JSON.parse( $code.val() );
    } catch(error) {
      dataflow.log("Invalid JSON");
      return false;
    }
    if (graph) {
      var g = dataflow.loadGraph(graph);
      g.trigger("change");
    }
  };

}(Dataflow) );
