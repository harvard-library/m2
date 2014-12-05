Annotator.Widget.prototype.checkOrientation = function() {
    var current, offset, viewport, widget, containerOffset;
    this.resetOrientation();
    container = jQuery(this.element[0].parentNode.parentNode.nextSibling);  //this is extremely brittle. gross
    containerOffset = container.offset();
    widget = this.element.children(":first");
    offset = widget.offset();
    viewport = {
      top: containerOffset.top,
      right: containerOffset.left + container.width()
    };
    //console.log(viewport);
    current = {
      top: offset.top,
      right: offset.left + widget.width()
    };
    //console.log(current);
    if ((current.top - viewport.top) < 0) {
      this.invertY();
    }
    if ((current.right - viewport.right) > 0) {
      this.invertX();
    }
    return this;
};

    