import path from 'node:path';
import { existsSync } from 'node:fs';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const repoRootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.resolve(repoRootDir, 'dist');

const clientDistDir = path.resolve(repoRootDir, 'client/dist');
const serverBuildDir = path.resolve(repoRootDir, 'server/dist');
const typesBuildDir = path.resolve(repoRootDir, 'types/dist');

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd ?? repoRootDir,
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        ...(options?.env ?? {}),
      },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function ensureBuildOutputsExist() {
  if (!existsSync(clientDistDir)) throw new Error(`Missing ${clientDistDir}. Did the client build run?`);
  if (!existsSync(serverBuildDir)) throw new Error(`Missing ${serverBuildDir}. Did the server build run?`);
  if (!existsSync(typesBuildDir)) throw new Error(`Missing ${typesBuildDir}. Did the types build run?`);
}

async function writeRuntimeTypesPackage() {
  const runtimeTypesDir = path.resolve(distDir, 'types');
  await mkdir(runtimeTypesDir, { recursive: true });
  await cp(typesBuildDir, path.resolve(runtimeTypesDir, 'dist'), { recursive: true });

  const runtimeTypesPackageJson = {
    name: '@trpc-todo/types',
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
    },
    dependencies: {
      zod: '^4.1.7',
    },
  };

  await writeFile(
    path.resolve(runtimeTypesDir, 'package.json'),
    `${JSON.stringify(runtimeTypesPackageJson, null, 2)}\n`,
    'utf8'
  );
}

async function writeRuntimePackageJson() {
  const runtimePackageJson = {
    name: 'trpc-todo-dist',
    private: true,
    type: 'module',
    // For convenience: run from `dist/` directly.
    main: './server.js',
    scripts: {
      start: 'node ./server.js',
    },
    dependencies: {
      '@hono/node-server': '^2.0.2',
      '@trpc/server': '^11.17.0',
      hono: '^4.12.18',
      superjson: '^2.2.6',
      zod: '^4.4.3',
      '@trpc-todo/types': 'file:./types',
    },
  };

  await writeFile(path.resolve(distDir, 'package.json'), `${JSON.stringify(runtimePackageJson, null, 2)}\n`, 'utf8');
}

async function assembleDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await ensureBuildOutputsExist();

  // Server runtime files at dist root: dist/server.js, dist/router.js, dist/db.js, etc.
  await cp(serverBuildDir, distDir, { recursive: true });

  // Frontend at dist/public
  await cp(clientDistDir, path.resolve(distDir, 'public'), { recursive: true });

  // Workspace package `@trpc-todo/types` as a local file dependency (no registry publishing required).
  await writeRuntimeTypesPackage();
  await writeRuntimePackageJson();
}

async function installRuntimeDeps() {
  // Install prod deps into dist/node_modules (no shell operators, cross-platform).
  // `--force` avoids interactive prompts about purging node_modules.
  // `--no-frozen-lockfile` avoids pnpm's CI default behavior (we intentionally generate dist/package.json).
  // `--ignore-workspace` is critical because `dist/` lives inside this workspace.
  // Without it, pnpm will walk up to the repo root and install workspace deps instead of dist deps.
  await runCommand('pnpm', ['install', '--dir', distDir, '--ignore-workspace', '--prod', '--force', '--no-frozen-lockfile'], {
    cwd: repoRootDir,
    env: {
      CI: '1',
    },
  });
}

async function main() {
  // Build all workspace packages.
  await runCommand('pnpm', ['exec', 'turbo', 'run', 'build'], { cwd: repoRootDir });

  await assembleDist();
  await installRuntimeDeps();

  console.log(`\nBuilt runtime output at: ${distDir}`);
  console.log(`Run: node dist/server.js`);
}

await main();

