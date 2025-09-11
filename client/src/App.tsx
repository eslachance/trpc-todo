import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Todo
            <span className="text-blue-600">List</span>
          </h1>
          <p className="text-gray-600">Stay organized and get things done</p>
        </div>

        {/* Add Todo Form */}
        <AddTodo />

        {/* Todo List */}
        <TodoList />

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Built with{' '}
            <span className="text-blue-600 font-semibold">TRPC</span>,{' '}
            <span className="text-cyan-600 font-semibold">React 19</span>,{' '}
            <span className="text-emerald-600 font-semibold">Tailwind 4</span>, and{' '}
            <span className="text-purple-600 font-semibold">Hono</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;