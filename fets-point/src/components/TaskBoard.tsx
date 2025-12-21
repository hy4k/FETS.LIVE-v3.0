import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useTasks, useTaskMutations } from '../hooks/useFetsConnect'
import { useAuth } from '../hooks/useAuth'
import { GripVertical } from 'lucide-react'

type TaskStatus = 'pending' | 'in_progress' | 'completed'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assigned_by?: {
    full_name: string
  }
}

interface TaskColumns {
  pending: Task[]
  in_progress: Task[]
  completed: Task[]
}

const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  pending: { title: 'Pending', color: 'bg-gray-200' },
  in_progress: { title: 'In Progress', color: 'bg-blue-200' },
  completed: { title: 'Completed', color: 'bg-green-200' },
}

export function TaskBoard() {
  const { profile } = useAuth()
  const { data: tasks = [], isLoading } = useTasks(profile?.id)
  const { updateTask } = useTaskMutations(profile?.id)
  const [columns, setColumns] = useState<TaskColumns>({
    pending: [],
    in_progress: [],
    completed: [],
  })

  const memoizedColumns = useMemo(() => {
    const newColumns: TaskColumns = { pending: [], in_progress: [], completed: [] }
    if (tasks) {
      tasks.forEach((task: any) => {
        if (task.status && newColumns[task.status]) {
          newColumns[task.status].push(task)
        }
      })
    }
    return newColumns
  }, [tasks])

  useEffect(() => {
    setColumns(memoizedColumns)
  }, [memoizedColumns])

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return

    const startColId = source.droppableId as TaskStatus
    const endColId = destination.droppableId as TaskStatus

    if (startColId === endColId && source.index === destination.index) return

    const startCol = columns[startColId] ?? []
    const task = startCol.find(t => t.id === draggableId)

    if (!task) return

    // Optimistic UI Update
    const newColumns = { ...columns }
    newColumns[startColId] = newColumns[startColId].filter(t => t.id !== draggableId)
    // Ensure the destination column array exists
    if (!newColumns[endColId]) {
      newColumns[endColId] = []
    }
    setColumns(newColumns)

    // Persist change to the database
    updateTask({ id: draggableId, status: endColId })
  }

  if (isLoading) {
    return <div className="p-6">Loading Task Board...</div>
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Task Board</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-6 flex-1">
          {(Object.keys(columnConfig) as TaskStatus[]).map(columnId => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col bg-gray-100 rounded-lg p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''
                    }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">{columnConfig[columnId]?.title}</h3>
                    <span className="text-sm font-semibold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                      {columns[columnId]?.length || 0}
                    </span>
                  </div>
                  <div className="space-y-4 overflow-y-auto flex-1">
                    {columns[columnId]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white p-4 rounded-md shadow-sm border border-gray-200 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-gray-800">{task.title}</p>
                              <div {...provided.dragHandleProps} className="p-1 text-gray-400 hover:text-gray-700">
                                <GripVertical className="w-4 h-4" />
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                Assigned by: {task.assigned_by?.full_name || 'System'}
                              </p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default TaskBoard