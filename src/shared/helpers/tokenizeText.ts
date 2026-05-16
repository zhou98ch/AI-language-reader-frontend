export type TextToken = {
  text: string
  startOffset: number
  endOffset: number
  isWord: boolean
}

export function tokenizeText(text: string): TextToken[] {
  const tokens: TextToken[] = []
  const pattern = /[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)?|\s+|[^\s\p{L}\p{M}]+/gu

  for (const match of text.matchAll(pattern)) {
    const token = match[0]
    const startOffset = match.index ?? 0

    tokens.push({
      text: token,
      startOffset,
      endOffset: startOffset + token.length,
      isWord: /^[\p{L}\p{M}]/u.test(token),
    })
  }

  return tokens
}

export function getSentenceContext(text: string, startOffset: number, endOffset: number) {
  const leftBoundary = Math.max(
    text.lastIndexOf('.', startOffset - 1),
    text.lastIndexOf('!', startOffset - 1),
    text.lastIndexOf('?', startOffset - 1),
    text.lastIndexOf('\n', startOffset - 1),
  )
  const nextBoundaries = ['.', '!', '?', '\n']
    .map((mark) => text.indexOf(mark, endOffset))
    .filter((index) => index >= 0)
  const rightBoundary = nextBoundaries.length > 0 ? Math.min(...nextBoundaries) + 1 : text.length

  return text.slice(leftBoundary + 1, rightBoundary).trim()
}
