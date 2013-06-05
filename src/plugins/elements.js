( function(Dataflow) {

  var Elements = Dataflow.prototype.plugin("elements");

  Elements.list = [
    {type: "div",    attributes: ["id", "class", "style"], events: ["pointermove", "pointerover", "pointerout"]},
    {type: "button", attributes: ["id", "class", "style"], events: ["pointerdown", "pointerup"]}
  ];

}(Dataflow) );
