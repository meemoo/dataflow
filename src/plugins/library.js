( function(Dataflow) {
 
  var library = $("<ul />");

  _.each(Dataflow.nodes, function(node, index){
    var addButton = $("<button>+</button>")
      .click(function(){
        // Find vacant id
        var id = 1;
        while (Dataflow.currentGraph.nodes.get(id)){
          id++;
        }
        var newNode = new node.Model({
          id: id,
          x: window.scrollX - 100 + Math.floor($(window).width()/2),
          y: window.scrollY - 100 + Math.floor($(window).height()/2),
          parentGraph: Dataflow.currentGraph
        });
        Dataflow.currentGraph.nodes.add(newNode);
      });
    var item = $("<li />")
      .append(addButton)
      .append(index);
    library.append(item);
  });

  Dataflow.addPlugin("library", library);

}(Dataflow) );
