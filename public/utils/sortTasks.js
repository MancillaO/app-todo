export function sortTasks (tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return []
  }

  const sortedTasks = [...tasks]

  sortedTasks.sort((a, b) => {
    if (a.status === b.status) {
      // Si el status es igual, ordenamos por fecha (más reciente primero)
      return new Date(b.created_at) - new Date(a.created_at)
    }
    // Pendiente primero, Completada después
    return a.status === 'Pendiente' ? -1 : 1
  })

  return sortedTasks
}
