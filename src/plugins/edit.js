( function(Dataflow) {
 
  var template = 
    '<button id="dataflow-plugin-edit-selectall">Select All (A)</button><br />'+
    '<button id="dataflow-plugin-edit-cut">Cut (X)</button><br />'+
    '<button id="dataflow-plugin-edit-copy">Copy (C)</button><br />'+
    '<button id="dataflow-plugin-edit-paste">Paste (V)</button><br />';

  Dataflow.addPlugin("edit", template);

  // On change update code view
  Dataflow.on("change", function(graph){
    if (Dataflow.graph) {
      $("#code").val( JSON.stringify(Dataflow.graph.toJSON(), null, "  ") );
    }
  });

  //
  // A
  //

  function selectAll(){
    Dataflow.currentGraph.view.$(".node").addClass("selected");
  }
  $("#dataflow-plugin-edit-selectall").click(selectAll);

  //
  // X
  //

  function cut(){
    // Copy selected
    copy();
    // Move back so paste in original place
    _.each(copied.nodes, function(node){
      node.x -= 50;
      node.y -= 50;
    });
    // Remove selected
    var toRemove = Dataflow.currentGraph.nodes.filter(function(node){
      return node.view.$el.hasClass("selected");
    });
    _.each(toRemove, function(node){
      node.collection.remove(node);
    });
  }
  $("#dataflow-plugin-edit-cut").click(cut);

  //
  // C
  //

  var copied = {};
  function copy(){
    copied = {};
    // nodes
    copied.nodes = [];
    Dataflow.currentGraph.nodes.each(function(node){
      if (node.view.$el.hasClass("selected")) {
        copied.nodes.push( JSON.parse(JSON.stringify(node)) );
      }
    });
    // edges
    copied.edges = [];
    Dataflow.currentGraph.edges.each(function(edge){
      // Only copy the edges between nodes being copied
      var connectedSource = _.any(copied.nodes, function(node){
        return (edge.source.parentNode.id === node.id);
      });
      var connectedTarget = _.any(copied.nodes, function(node){
        return (edge.target.parentNode.id === node.id);
      });
      if (connectedSource && connectedTarget){
        copied.edges.push( JSON.parse(JSON.stringify(edge)) );
      }
    });
  }
  $("#dataflow-plugin-edit-copy").click(copy);

  //
  // V
  //

  function paste(){
    if (copied && copied.nodes.length > 0) {
      var newNodes = [];
      // Deselect all
      Dataflow.currentGraph.view.$(".node").removeClass("selected");
      _.each(copied.nodes, function(node){
        // Offset pasted
        node.x += 50;
        node.y += 50;
        node.parentGraph = Dataflow.currentGraph;
        var oldId = node.id;
        // Make unique id
        while (Dataflow.currentGraph.nodes.get(node.id)){
          node.id++;
        }
        // Update copied edges with new node id
        if (oldId !== node.id) {
          _.each(copied.edges, function(edge){
            if (edge.source.node === oldId) {
              edge.source.node = node.id;
            }
            if (edge.target.node === oldId) {
              edge.target.node = node.id;
            }
          });
        }
        var newNode = new Dataflow.nodes[node.type].Model(node);
        Dataflow.currentGraph.nodes.add(newNode);
        // Select it
        newNode.view.$el.addClass("selected");
      });
      // Add edges
      _.each(copied.edges, function(edge){
        // Clone edge object (otherwise weirdness on multiple pastes)
        edge = JSON.parse(JSON.stringify(edge));
        // Add it
        edge.parentGraph = Dataflow.currentGraph;
        edge.id = edge.source.node+":"+edge.source.port+"→"+edge.target.node+":"+edge.target.port;
        var newEdge = new Dataflow.modules.edge.Model(edge);
        Dataflow.currentGraph.edges.add(newEdge);
      });
    }
    // Rerender edges
    _.defer(function(){
      Dataflow.currentGraph.view.rerenderEdges();
    });
  }
  $("#dataflow-plugin-edit-paste").click(paste);


}(Dataflow) );
