#!/usr/bin/env node
const autosuggestTrie = require('autosuggest-trie')
const diffy = require('diffy')()
const input = require('diffy/input')()
const hyperdb = require('hyperdb')
const colors = require('kleur')
const Menu = require('menu-string')
const sortBy = require('sort-by')

const args = process.argv.slice(2)
if (args.length != 1) {
  console.error('usage: hyperdb-explorer <path-to-hyperdb>')
  process.exit(1)
}
const path = args[0]

const db = hyperdb(path)

const nodes = []
db.createReadStream()
  .on('data', n => {
    nodes.push(n)
  })
  .on('end', render)

function render() {
  const listItems = nodes.map(([node, ...conflicts], i) => ({
    i,
    key: node.key,
    conflicts: conflicts.length,
  }))
  listItems.sort(sortBy('key'))

  const autosuggest = autosuggestTrie(listItems, 'key')

  let detail = null
  let height, menu
  function setState() {
    height = diffy.height - 1
    const line = input.rawLine()
    const items = line ? autosuggest.getMatches(line) : listItems
    let selected = 0
    if (menu != null && menu.selected() != null) {
      selected = items.findIndex(item => item.i === menu.selected().i)
      if (selected < 0) {
        selected = 0
      }
    }
    if (items.length === 0) {
      menu = new Menu({ items: [{ text: 'No keys', separator: true }] })
    } else {
      menu = new Menu({
        items,
        render: renderListItem,
        height,
        selected,
      })
    }
  }
  setState()

  input.on('up', () => {
    menu.up()
    diffy.render()
  })
  input.on('down', () => {
    menu.down()
    diffy.render()
  })
  input.on('update', () => {
    setState()
    diffy.render()
  })
  input.on('enter', () => {
    detail = detail == null ? menu.selected().i : null
    diffy.render()
  })
  diffy.on('resize', () => {
    setState()
    diffy.render()
  })

  diffy.render(() => {
    if (detail != null) {
      return renderKey(nodes[detail])
    } else {
      return menu.toString() + `\nType to filter: ${colors.bold(input.line())}`
    }
  })
}

function renderListItem({ key, conflicts }, selected) {
  const str = `${key} ${
    conflicts > 0 ? colors.bold(`${conflicts + 1} conflicting nodes`) : ''
  }`
  return selected ? colors.bold(str) : str
}

function renderKey(nodes) {
  const lines = [colors.bold(nodes[0].key)]
  for (const [i, node] of nodes.entries()) {
    lines.push(`\nNode #${i}`)
    lines.push('\n' + renderNode(node))
  }
  return lines.join('\n')
}

function renderNode(node) {
  const lines = [
    node.deleted ? colors.bold('deleted') : null,
    colors.bold('value'),
    node.value,
    '',
    colors.bold('feed'),
    renderFeed(node.feed),
  ]
  return lines.filter(x => x !== null).join('\n')
}

function renderFeed(i) {
  const feed = db.feeds[i]
  return [
    `key: ${feed.key.toString('hex')}`,
    `discovery key: ${feed.discoveryKey.toString('hex')}`,
    `length: ${feed.length}`,
    `byte length: ${feed.byteLength}`,
  ].join('\n')
}