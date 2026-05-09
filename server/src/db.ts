import type { Todo } from '@trpc-todo/types';

/**
 * NOTE: This file exists only to make the demo feel "real".
 *
 * We intentionally use JSONPlaceholder (`https://jsonplaceholder.typicode.com/todos`) as a fake backend
 * (it's public, fast, and doesn't require a DB). JSONPlaceholder does not actually persist updates.
 *
 * To keep the app interactive while the server is running, we keep an in-memory `Map()` cache.
 * That cache provides pseudo-persistence for creates/updates/deletes until the process restarts.
 */

type JsonPlaceholderTodo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const jsonPlaceholderBaseUrl = 'https://jsonplaceholder.typicode.com';

const todosCache = new Map<number, Todo>();
let hasLoadedRemoteTodos = false;
let nextLocalTodoId = 100000;

function toTodo(remoteTodo: JsonPlaceholderTodo): Todo {
  return {
    userId: remoteTodo.userId,
    id: remoteTodo.id,
    title: remoteTodo.title,
    completed: remoteTodo.completed,
  };
}

async function loadRemoteTodosOnce(): Promise<void> {
  if (hasLoadedRemoteTodos) return;

  const response = await fetch(`${jsonPlaceholderBaseUrl}/todos`);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote todos: ${response.status} ${response.statusText}`);
  }

  const remoteTodos = (await response.json()) as JsonPlaceholderTodo[];
  for (const remoteTodo of remoteTodos) {
    const todo = toTodo(remoteTodo);
    todosCache.set(todo.id, todo);
  }

  const maxRemoteId = remoteTodos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0);
  nextLocalTodoId = Math.max(nextLocalTodoId, maxRemoteId + 1);
  hasLoadedRemoteTodos = true;
}

// Helper functions for database operations
export class TodoDatabase {
  static async create(todo: Omit<Todo, 'id'>): Promise<Todo> {
    await loadRemoteTodosOnce();

    const id = nextLocalTodoId++;

    const newTodo: Todo = {
      id,
      ...todo,
    };

    todosCache.set(id, newTodo);
    return newTodo;
  }

  static async findAll(): Promise<Todo[]> {
    await loadRemoteTodosOnce();
    return Array.from(todosCache.values());
  }

  static async findById(id: number): Promise<Todo | undefined> {
    await loadRemoteTodosOnce();
    return todosCache.get(id) ?? undefined;
  }

  static async update(id: number, updates: Partial<Omit<Todo, 'id'>>): Promise<Todo | undefined> {
    await loadRemoteTodosOnce();

    const existingTodo = todosCache.get(id);
    if (!existingTodo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      ...updates,
      id, // Ensure id doesn't change
    };

    todosCache.set(id, updatedTodo);
    return updatedTodo;
  }

  static async delete(id: number): Promise<boolean> {
    await loadRemoteTodosOnce();

    return todosCache.delete(id);
  }
}
