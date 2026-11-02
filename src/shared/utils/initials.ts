export function getInitials(name: string): string {
  if (!name || !name.trim()) return '??'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

