import React from 'react';
import createClass from 'create-react-class';
import cx from 'classnames';

var Node = createClass({
  displayName: 'UITreeNode',

  renderCollapse() {
    const { index } = this.props;

    if ((index.children && index.children.length) || (index.node && index.node.isParent === true)) {
      const { collapsed } = index.node;
      const cssClasses = cx('nrby-tree-collapse', collapsed ? 'caret-right' : 'caret-down');
      return (
        <span
          className={cssClasses}
          onMouseDown={e => {e.stopPropagation()}}
          onClick={this.handleCollapse}>
        </span>
      );
    }

    return null;
  },

  renderChildren() {
    const { 
      index, tree, dragging, paddingLeft, onCollapse, onDragStart
    } = this.props;

    if (index.children && index.children.length) {
      let childrenStyles = {};
      if (index.node.collapsed) childrenStyles.display = 'none';
      childrenStyles['paddingLeft'] = this.props.paddingLeft + 'px';

      return (
        <div className="children" style={childrenStyles}>
          { index.children.map( child => {
            const childIndex = tree.getIndex(child);
            return (
              <Node
                tree={tree}
                index={childIndex}
                key={childIndex.id}
                dragging={dragging}
                paddingLeft={paddingLeft}
                onCollapse={onCollapse}
                onDragStart={onDragStart}
              />
            );
          })}
        </div>
      );
    }

    return null;
  },

  render() {
    const { tree, index, dragging } = this.props;
    const cssClasses = cx('m-node', { 'placeholder': index.id === dragging });

    return (
      <div className={cssClasses}>
        <div className="inner" ref="inner" onMouseDown={this.handleMouseDown}>
          {this.renderCollapse()}
          {tree.renderNode(index, tree)}
        </div>
        {this.renderChildren()}
      </div>
    );
  },

  handleCollapse(e) {
    e.stopPropagation();
    const { index, onCollapse } = this.props;
    if(onCollapse) onCollapse(index.id);
  },

  handleMouseDown(e) {
    const { index, onDragStart } = this.props;
    // TODO: shouldn't be handling refs like this
    let dom = this.refs.inner;

    if(onDragStart && !window.dragMode) {
      onDragStart(index.id, dom, e);
    }
  }
});

module.exports = Node;
