import { z } from 'zod';

// Todo schema for validation
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  completed: z.boolean().optional(),
});

export type Todo = z.infer<typeof todoSchema>;
export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
