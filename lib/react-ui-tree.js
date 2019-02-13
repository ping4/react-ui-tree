import React from 'react';
import createClass from 'create-react-class';
import PropTypes from 'prop-types';
import Tree from './tree';
import Node from './node';

module.exports = createClass({
  displayName: 'UITree',

  propTypes: {
    tree: PropTypes.object.isRequired,
    paddingLeft: PropTypes.number,
    renderNode: PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      paddingLeft: 20
    };
  },

  getInitialState() {
    return this.init(this.props);
  },

  componentWillReceiveProps(nextProps) {
    if(!this._updated) this.setState(this.init(nextProps));
    else this._updated = false;
  },

  init(props) {
    var tree = new Tree(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    if (props.afterInitialize) props.afterInitialize(this);

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  },

  getDraggingDom() {
    const { tree, dragging } = this.state;
    const { paddingLeft } = this.props;

    if (dragging && dragging.id) {
      const draggingIndex = tree.getIndex(dragging.id);
      const draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return (
        <div className="m-draggable" style={draggingStyles}>
          <Node
            tree={tree}
            index={draggingIndex}
            paddingLeft={paddingLeft}
          />
        </div>
      );
    }

    return null;
  },

  render() {
    const { tree, dragging } = this.state;
    const { paddingLeft } = this.props;
    const draggingDom = this.getDraggingDom();

    return (
      <div className="m-tree">
        {draggingDom}
        <Node
          tree={tree}
          index={tree.getIndex(1)}
          key={1}
          paddingLeft={paddingLeft}
          onDragStart={this.dragStart}
          onCollapse={this.toggleCollapse}
          dragging={dragging && dragging.id}
        />
      </div>
    );
  },

  dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    this.oldIndex = this.state.tree.getIndex(id);

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  },

  // oh
  drag(e) {
    if (this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    const { tree, dragging } = this.state;
    const { paddingLeft } = this.props;
    let newIndex = null;
    let index = tree.getIndex(dragging.id);
    let collapsed = index.node.collapsed;

    let _startX = this._startX;
    let _startY = this._startY;
    let _offsetX = this._offsetX;
    let _offsetY = this._offsetY;

    let pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    let diffX = dragging.x - paddingLeft/2 - (index.left-2) * paddingLeft;
    let diffY = dragging.y - dragging.h/2 - (index.top-2) * dragging.h;

    if (diffX < 0) { // left
      if (index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
      }
    } else if (diffX > paddingLeft) { // right
      if (index.prev) {
        let prevNode = tree.getIndex(index.prev).node;
        if(!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
        }
      }
    }

    if (newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (diffY < 0) { // up
      let above = tree.getNodeByTop(index.top-1);
      newIndex = tree.move(index.id, above.id, 'before');
    } else if (diffY > dragging.h) { // down
      if (index.next) {
        let below = tree.getIndex(index.next);
        if(below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, 'prepend');
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
        }
      } else {
        let below = tree.getNodeByTop(index.top + index.height);
        if (below && below.parent !== index.id) {
          if (below.children && below.children.length) {
            newIndex = tree.move(index.id, below.id, 'prepend');
          } else {
            newIndex = tree.move(index.id, below.id, 'after');
          }
        }
      }
    }

    if (newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    this.setState({tree, dragging});
  },

  dragEnd() {
    const { tree } = this.state;
    const { onParentChange } = this.props;
    const index = tree.getIndex(this.dragging.id);
    const oldIndex = this.oldIndex;
    let self = this;
    this.setState({
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    });

    this.change(tree);
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);

    if (oldIndex.parent != index.parent) {
      const node = index.node;
      const parentId = tree.getIndex(index.parent).node.id;

      // The parent node was changed and we should update the server
      if (onParentChange) {
        window.dragMode = true;
        onParentChange(node, parentId, function () {
          tree.resetPosition(index.id, oldIndex);
          self.setState({tree});
          window.dragMode = false
        });
      }
    }
  },

  change(tree) {
    this._updated = true;
    if (this.props.onChange) this.props.onChange(tree.obj);
  },

  toggleCollapse(nodeId) {
    var tree = this.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  },

  removeNode(indexId) {
    const { tree } = this.state;
    tree.remove(indexId);

    this.setState({tree});
    this.change(tree);
  }
});
