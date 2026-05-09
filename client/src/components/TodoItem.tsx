import { useState } from 'react';
import { trpc } from '../utils/trpc';
import type { Todo } from '@trpc-todo/types';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const utils = trpc.useUtils();

  const toggleMutation = trpc.todo.toggle.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const updateMutation = trpc.todo.update.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
      setIsEditing(false);
    },
  });

  const deleteMutation = trpc.todo.delete.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate({ id: todo.id });
  };

  const handleUpdate = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      updateMutation.mutate({
        id: todo.id,
        data: { title: editTitle.trim() },
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: todo.id });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
      <button
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
          todo.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 hover:border-emerald-400'
        } ${toggleMutation.isPending ? 'opacity-50' : ''}`}
      >
        {todo.completed && (
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={handleKeyPress}
            className="w-full px-2 py-1 text-gray-900 bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`block cursor-text hover:text-blue-600 transition-colors duration-200 ${
              todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          title="Edit todo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Delete todo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
