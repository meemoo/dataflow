( function(Dataflow) {
 
  var library = $("<ul />");

  // function addNodeToCurrent(node) {
  // }

  var exclude = ["base", "base-resizable"];

  _.each(Dataflow.nodes, function(node, index){
    if (exclude.indexOf(index) === -1) {
      var addButton = $("<button>+</button>")
        .click(function(){
          // Deselect others
          Dataflow.currentGraph.view.$(".node").removeClass("selected");
          // Find vacant id
          var id = Dataflow.currentGraph.nodes.length + 1;
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
          // Select and bring to top
          newNode.view.select();
        });
      var item = $("<li />")
        .append(addButton)
        .append(index);
      library.append(item);
    }
  });

  Dataflow.addPlugin("library", library);

}(Dataflow) );
