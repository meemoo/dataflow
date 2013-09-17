( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    function showInspector(){
      var selectedNodes = dataflow.currentGraph.nodes.where({selected:true});
      selectedNodes.forEach(function(node){
        var inspector = node.view.getInspector();
        inspector.set("pinned", true);
        dataflow.addCard( inspector );
      });
      var selectedEdges = dataflow.currentGraph.edges.where({selected:true});
      selectedEdges.forEach(function(edge){
        var inspector = edge.view.getInspector();
        inspector.set("pinned", true);
        dataflow.addCard( inspector );
      });
    }

    dataflow.addContext({
      id: "inspector",
      icon: "info-sign",
      label: "inspect",
      action: showInspector,
      contexts: ["one", "twoplus"]
    });

  };

}(Dataflow) );
