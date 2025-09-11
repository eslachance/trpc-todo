import { trpc } from '../utils/trpc';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { data: todos, isLoading, error } = trpc.todo.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="font-semibold">Failed to load todos</p>
        </div>
        <p className="text-red-600 text-sm">{error.message}</p>
        <p className="text-red-500 text-sm mt-2">Make sure the server is running on localhost:3001</p>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No todos yet!</h3>
        <p className="text-gray-500">Add your first todo above to get started.</p>
      </div>
    );
  }

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{totalCount}</span> total, {' '}
          <span className="font-semibold text-emerald-600">{completedCount}</span> completed
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Todo Items */}
      <div className="space-y-3">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}
