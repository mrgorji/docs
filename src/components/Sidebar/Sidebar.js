import React, { Component } from 'react'
import Link from 'gatsby-link'
import { difference } from 'lodash'

import './Sidebar.css'

class Sidebar extends Component {
  state = {
    open: [],
  }

  handleOnClick = node => {
    this.setState({
      open: node.fields.slug.split('/').filter(p => p),
    })
  }

  componentDidMount() {
    this.setState({
      open: this.props.location.pathname
        .split('/')
        .filter(p => p),
    })
  }

  mapSidebarItems = (node, pages, isChildNode) => {
    const isActive = this.props.location.pathname.includes(node.fields.slug);
    const nodePath = node.fields.slug.split('/').filter(p => p);

    const [subset, superset] = this.state.open.length > nodePath.length ? [nodePath, this.state.open] : [this.state.open, nodePath];    

    const diff = superset.length - subset.length;

    const match = difference(subset, superset).length === 0;

    const isChildOfCurrentNode = superset[superset.length - (diff + 2)] === (subset[subset.length - 2]) && diff === 1;

    const sharesParentNode = superset[superset.length - 2] === subset[subset.length - 2];

    const isOpen = match && diff <= 1 || sharesParentNode || (isChildOfCurrentNode && this.state.open.length > 2);


    return (
      <li
        key={node.id}
        style={{
          display: !isChildNode || (isChildNode && isOpen) ? 'block' : 'none',
          paddingRight: isActive ? 0 : 10,
          lineHeight: 'initial',
        }}
      >
        <Link to={node.fields.slug} onClick={() => this.handleOnClick(node)}>
          {isActive ? (
            <strong>{node.frontmatter.title}</strong>
          ) : (
            node.frontmatter.title
          )}
        </Link>
        {node.children.length > 0 && (
          <ul>
            {node.children.map(child => {
              const childNode = pages.find(n => n.node.id === child.id);
              return this.mapSidebarItems(childNode.node, pages, true);
            })}
          </ul>
        )}
      </li>
    )
  }

  render() {
    const order = [
      'Developer Benefits',
      'Applications',
      'Engines',
      'Libraries'
    ]
    const pages = this.props.data.allMarkdownRemark.edges.sort(function(a, b) {
      return (
        order.indexOf(a.node.frontmatter.title) -
        order.indexOf(b.node.frontmatter.title)
      )
    }) // TODO graphql sort

    return (
      <ul className="sidebar">
        {pages
          .filter(({ node }) => node.fields.rootDir)
          .map(({ node }) => this.mapSidebarItems(node, pages))}
      </ul>
    )
  }
}

export default Sidebar