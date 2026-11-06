import { type TreeNode } from '../../../contexts/StudyContext'

export function filterTreeNodes(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes
  const q = query.trim().toLowerCase()
  if (!q) return nodes

  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchTitle = (node.title || '').toLowerCase().includes(q)
    const matchAuthor = (node.author || '').toLowerCase().includes(q)
    const isSelfMatch = matchTitle || matchAuthor

    // 1. If this node is a BOOK:
    if (node.is_book) {
      if (isSelfMatch) {
        acc.push({
          ...node,
          children: node.children || [],
        })
        return acc
      }

      // If the book title itself didn't match, check if any loaded chapters match
      if (node.children && node.children.length > 0) {
        const matchedChapters = filterTreeNodes(node.children, query)
        if (matchedChapters.length > 0) {
          acc.push({
            ...node,
            children: matchedChapters,
            _hasMatchedChild: true,
          } as any)
          return acc
        }
      }

      return acc
    }

    // 2. For CATEGORIES / FOLDERS:
    const filteredChildren = node.children
      ? filterTreeNodes(node.children, query)
      : []

    if (isSelfMatch || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren,
        _hasMatchedChild: filteredChildren.length > 0 && !isSelfMatch,
      } as any)
    }

    return acc
  }, [])
}

export function countTotalBooks(treeData: TreeNode[]): number {
  if (!treeData || treeData.length === 0) return 51

  const countBooks = (n: TreeNode): number => {
    if (n.is_book) return 1
    if (!n.children || n.children.length === 0) return 0
    return n.children.reduce((acc, child) => acc + countBooks(child), 0)
  }

  const count = treeData.reduce((acc, node) => acc + countBooks(node), 0)
  return count > 0 ? count : 51
}

