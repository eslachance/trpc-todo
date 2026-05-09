# TRPC Todo List - Full Stack Example

A comprehensive example demonstrating **proper TRPC implementation** between a React/Vite frontend and Node.js backend, showcasing type-safe API communication, modern tooling, and best practices.

## 🎯 Purpose

This project serves as a **complete reference implementation** for:
- Setting up TRPC with React Query integration
- Configuring type-safe client-server communication
- Modern full-stack development practices
- Production-ready project structure

## 🛠 Tech Stack

### Backend (`/server`)
- **[Hono](https://hono.dev/)** - Fast, lightweight web framework
- **[TRPC](https://trpc.io/)** - End-to-end typesafe APIs
- **[Enmap](https://enmap.alterion.dev/)** - Persistent file-based database
- **TypeScript** - Full type safety
- **Zod** - Runtime schema validation

### Frontend (`/client`)
- **React 19** - Latest React with modern features
- **[Vite](https://vite.dev/)** - Lightning-fast build tool
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling (no config!)
- **TRPC Client + React Query** - Type-safe API calls with caching
- **TypeScript** - End-to-end type safety

## 📁 Project Structure

```
trpc-todo/
├── types/                     # Shared types & schemas (workspace package)
│   └── src/                   # Zod schemas + inferred TS types
├── server/                    # Backend application
│   ├── src/
│   │   ├── server.ts         # 🔑 Main server setup with Hono + TRPC
│   │   ├── router.ts         # 🔑 TRPC router with all procedures
│   │   └── db.ts             # Database layer with Enmap
│   ├── package.json          # Server dependencies
│   └── tsconfig.json         # TypeScript config
└── client/                   # Frontend application
    ├── src/
    │   ├── utils/trpc.ts     # 🔑 TRPC client configuration
    │   ├── providers/        # React providers
    │   ├── components/       # UI components
    │   └── main.tsx          # 🔑 App entry with TRPC provider
    ├── vite.config.ts        # 🔑 Vite config with proxy setup
    └── package.json          # Client dependencies
```

This repo is a **pnpm workspace** managed with **Turborepo**:

- `pnpm-workspace.yaml`: workspace package list
- `turbo.json`: task orchestration (`dev`, `build`, `lint`, `typecheck`)
- Shared code is published internally via workspace packages (no `../../../server/src/*` imports)

## 🔑 Key Implementation Files

### 1. **Server Setup** - [`server/src/server.ts`](./server/src/server.ts)

Shows how to properly integrate TRPC with Hono:

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router.js';

// TRPC API handler
app.all('/api/trpc/*', (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  });
});
```

**Key concepts demonstrated:**
- TRPC adapter integration with Hono
- CORS configuration for cross-origin requests
- Proper endpoint routing structure

### 2. **TRPC Router Definition** - [`server/src/router.ts`](./server/src/router.ts)

Comprehensive example of TRPC procedures with validation:

```typescript
export const todoRouter = router({
  // Query example
  getAll: publicProcedure.query(async () => {
    const todos = await TodoDatabase.findAll();
    return todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  // Mutation with input validation
  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      return await TodoDatabase.create({
        title: input.title,
        completed: false,
      });
    }),
});
```

**Key concepts demonstrated:**
- Query vs Mutation procedures
- Input validation with Zod schemas
- Error handling and type safety
- Nested router organization

### 3. **Shared Type Definitions** - [`types/src`](./types/src)

Shows proper schema definition and type inference:

```typescript
export const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Todo = z.infer<typeof todoSchema>;
```

**Key concepts demonstrated:**
- Zod schema definition
- Type inference from schemas
- Input/output type separation
- Validation with custom error messages

### 4. **TRPC Client Configuration** - [`client/src/utils/trpc.ts`](./client/src/utils/trpc.ts)

Essential client setup for type-safe API calls:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@trpc-todo/server';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});
```

**Key concepts demonstrated:**
- Type-safe client generation from server router
- HTTP batch link configuration
- Credential handling for authentication
- Type inference for inputs/outputs

### 5. **React Integration** - [`client/src/providers/TRPCProvider.tsx`](./client/src/providers/TRPCProvider.tsx)

Proper React Query + TRPC provider setup:

```typescript
export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Key concepts demonstrated:**
- React Query client configuration
- TRPC provider setup
- Caching strategies
- Provider composition

### 6. **Vite Proxy Configuration** - [`client/vite.config.ts`](./client/vite.config.ts)

Development proxy setup for seamless API communication:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001'
      },
    }
  }
});
```

**Key concepts demonstrated:**
- Development proxy configuration
- Avoiding CORS issues in development
- Plugin integration (Tailwind 4)

## 🚀 Usage Examples

### Making Type-Safe API Calls

```typescript
// In React components
const { data: todos, isLoading } = trpc.todo.getAll.useQuery();

const createMutation = trpc.todo.create.useMutation({
  onSuccess: () => {
    utils.todo.getAll.invalidate(); // Auto-refresh cache
  },
});

// Fully type-safe - TypeScript knows the exact shape!
createMutation.mutate({ title: "New todo" });
```

### Real-Time Cache Updates

```typescript
const utils = trpc.useUtils();

// Optimistic updates
const toggleMutation = trpc.todo.toggle.useMutation({
  onMutate: async ({ id }) => {
    await utils.todo.getAll.cancel();
    const previousTodos = utils.todo.getAll.getData();
    
    utils.todo.getAll.setData(undefined, (old) => 
      old?.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
    
    return { previousTodos };
  },
});
```

## 🏃‍♂️ Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development (client + server together):**
   ```bash
   pnpm dev
   ```

3. **Open application:**
   - Frontend: http://localhost:5173
   - API Health: http://localhost:3001/health

### Native dependencies (Enmap / better-sqlite3)

This project uses **Enmap**, which depends on **`better-sqlite3`** (a native addon). pnpm may block native build scripts unless they are explicitly allowlisted.

This repo already includes the allowlist under `pnpm.onlyBuiltDependencies` in the root `package.json`. If you ever see a bindings error again, the fix is:

```bash
pnpm rebuild better-sqlite3
```

## 🧰 Workspace scripts

From the repo root:

- `pnpm dev`: run client + server in parallel via Turbo
- `pnpm build`: build all packages
- `pnpm typecheck`: typecheck all packages
- `pnpm lint`: lint all packages

## 🎓 Learning Points

This example demonstrates:

### ✅ **Type Safety**
- End-to-end TypeScript from database to UI
- Runtime validation with compile-time types
- Auto-completion and error detection

### ✅ **Modern Development**
- Hot module replacement with Vite
- Tailwind 4 (no configuration needed!)
- React 19 with latest patterns

### ✅ **Production Patterns**
- Proper error handling and loading states
- Optimistic updates for better UX
- Efficient caching with React Query
- Structured project organization

### ✅ **Performance**
- Request batching with HTTP batch link
- Automatic query invalidation
- Background refetching
- File-based persistence with Enmap

## 🔍 Key Features Demonstrated

- **CRUD Operations**: Create, Read, Update, Delete todos
- **Real-time Updates**: Automatic UI updates on data changes
- **Optimistic Updates**: Instant UI feedback
- **Error Boundaries**: Graceful error handling
- **Loading States**: Professional loading indicators
- **Type Safety**: Compile-time and runtime validation

## 📚 Further Reading

- [TRPC Documentation](https://trpc.io/)
- [React Query Guide](https://tanstack.com/query/latest)
- [Hono Framework](https://hono.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Enmap Documentation](https://enmap.alterion.dev/)

---

*This example showcases production-ready patterns for building type-safe, modern full-stack applications with TRPC.*
