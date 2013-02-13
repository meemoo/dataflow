( function(Dataflow) {
 
  var buttons = $(
    '<div class="dataflow-plugin-edit">'+
      '<button class="selectall">Select All (A)</button><br />'+
      '<button class="cut">Cut (X)</button><br />'+
      '<button class="copy">Copy (C)</button><br />'+
      '<button class="paste">Paste (V)</button><br />'+
    '</div>'
  );

  Dataflow.addPlugin("edit", buttons);

  //
  // A
  //

  function selectAll(){
    Dataflow.currentGraph.view.$(".node").addClass("ui-selected");
  }
  buttons.children(".selectall").click(selectAll);

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
      return node.view.$el.hasClass("ui-selected");
    });
    _.each(toRemove, function(node){
      node.remove();
    });
  }
  buttons.children(".cut").click(cut);

  //
  // C
  //

  var copied = {};
  function copy(){
    copied = {};
    // nodes
    copied.nodes = [];
    Dataflow.currentGraph.nodes.each(function(node){
      if (node.view.$el.hasClass("ui-selected")) {
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
  buttons.children(".copy").click(copy);

  //
  // V
  //

  function paste(){
    if (copied && copied.nodes.length > 0) {
      // Deselect all
      Dataflow.currentGraph.view.$(".node").removeClass("ui-selected");
      // Add nodes
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
        newNode.view.select();
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
  buttons.children(".paste").click(paste);


}(Dataflow) );
