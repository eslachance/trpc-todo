import Enmap from 'enmap';
import { Todo } from './types.js';

// Initialize Enmap database for todos
export const todosDb = new Enmap<Todo>({
  name: 'todos',
});

// Helper functions for database operations
export class TodoDatabase {
  static async create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date();
    
    const newTodo: Todo = {
      id,
      ...todo,
      createdAt: now,
      updatedAt: now,
    };

    todosDb.set(id, newTodo);
    return newTodo;
  }

  static async findAll(): Promise<Todo[]> {
    return todosDb.values();
  }

  static async findById(id: string): Promise<Todo | undefined> {
    return todosDb.get(id);
  }

  static async update(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo | undefined> {
    const existingTodo = todosDb.get(id);
    if (!existingTodo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...existingTodo,
      ...updates,
      id, // Ensure id doesn't change
      createdAt: existingTodo.createdAt, // Preserve createdAt
      updatedAt: new Date(),
    };

    todosDb.set(id, updatedTodo);
    return updatedTodo;
  }

  static async delete(id: string): Promise<boolean> {
    todosDb.delete(id);
    return true;
  }
}
