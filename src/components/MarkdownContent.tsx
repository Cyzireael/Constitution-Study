import { Fragment, createElement, type ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g
  const result: ReactNode[] = []
  let offset = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text))) {
    if (match.index > offset) result.push(text.slice(offset, match.index))
    const token = match[0]
    const content = token.startsWith('**') || token.startsWith('__') ? token.slice(2, -2) : token.slice(1, -1)
    const node = token.startsWith('**') || token.startsWith('__')
      ? createElement('strong', { key: `${keyPrefix}-${match.index}` }, content)
      : token.startsWith('`')
        ? createElement('code', { key: `${keyPrefix}-${match.index}` }, content)
        : createElement('em', { key: `${keyPrefix}-${match.index}` }, content)
    result.push(node)
    offset = match.index + token.length
  }

  if (offset < text.length) result.push(text.slice(offset))
  return result
}

interface MarkdownBlock {
  kind: 'paragraph' | 'heading' | 'list' | 'quote'
  text: string
  depth?: number
  ordered?: boolean
}

function parseBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  let paragraph: string[] = []
  let list: string[] = []
  let listOrdered: boolean | undefined

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ kind: 'list', text: list.join('\n'), ordered: listOrdered })
    list = []
    listOrdered = undefined
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    const listItem = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/)
    const quote = line.match(/^>\s?(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'heading', depth: heading[1].length, text: heading[2] })
    } else if (listItem) {
      flushParagraph()
      const ordered = Boolean(listItem[2])
      if (list.length && listOrdered !== ordered) flushList()
      listOrdered = ordered
      list.push(listItem[3])
    } else if (quote) {
      flushParagraph()
      flushList()
      blocks.push({ kind: 'quote', text: quote[1] })
    } else if (!line.trim()) {
      flushParagraph()
      flushList()
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      {parseBlocks(content).map((block, index) => {
        const key = `block-${index}`
        const children = renderInline(block.text, key)
        if (block.kind === 'heading') return createElement(`h${block.depth}`, { key }, children)
        if (block.kind === 'quote') return <blockquote key={key}>{children}</blockquote>
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return <List key={key}>{block.text.split('\n').map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</List>
        }
        return <p key={key}>{children.map((child, childIndex) => <Fragment key={`${key}-${childIndex}`}>{child}</Fragment>)}</p>
      })}
    </div>
  )
}
