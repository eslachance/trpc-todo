import { z } from 'zod';

export const todoSchema = z.object({
  userId: z.number().int().positive(),
  id: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().default(false),
});

export const createTodoSchema = z.object({
  userId: z.number().int().positive().optional().default(1),
  title: z.string().min(1, 'Title is required'),
});

export const updateTodoSchema = z.object({
  userId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required').optional(),
  completed: z.boolean().optional(),
});

export type Todo = z.infer<typeof todoSchema>;
export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;

