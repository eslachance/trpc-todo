import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { TodoDatabase } from './db.js';
import { createTodoSchema, updateTodoSchema } from '@trpc-todo/types';

// Initialize TRPC
const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Todo router with CRUD operations
export const todoRouter = router({
  // Get all todos
  getAll: publicProcedure.query(async () => {
    try {
      const todos = await TodoDatabase.findAll();
      return todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error('Failed to fetch todos');
    }
  }),

  // Get todo by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const todo = await TodoDatabase.findById(input.id);
        if (!todo) {
          throw new Error('Todo not found');
        }
        return todo;
      } catch (error) {
        throw new Error('Failed to fetch todo');
      }
    }),

  // Create a new todo
  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      try {
        const todo = await TodoDatabase.create({
          title: input.title,
          completed: false,
        });
        return todo;
      } catch (error) {
        throw new Error('Failed to create todo');
      }
    }),

  // Update a todo
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateTodoSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const updatedTodo = await TodoDatabase.update(input.id, input.data);
        if (!updatedTodo) {
          throw new Error('Todo not found');
        }
        return updatedTodo;
      } catch (error) {
        throw new Error('Failed to update todo');
      }
    }),

  // Delete a todo
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const deleted = await TodoDatabase.delete(input.id);
        if (!deleted) {
          throw new Error('Todo not found');
        }
        return { success: true, id: input.id };
      } catch (error) {
        throw new Error('Failed to delete todo');
      }
    }),

  // Toggle todo completion status
  toggle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const existingTodo = await TodoDatabase.findById(input.id);
        if (!existingTodo) {
          throw new Error('Todo not found');
        }
        
        const updatedTodo = await TodoDatabase.update(input.id, {
          completed: !existingTodo.completed,
        });
        
        return updatedTodo;
      } catch (error) {
        throw new Error('Failed to toggle todo');
      }
    }),
});

// Main app router
export const appRouter = router({
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;
