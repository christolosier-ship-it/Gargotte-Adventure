import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@gargotte/common': alias('./packages/common/src/index.ts'),
      '@gargotte/engine': alias('./packages/engine/src/index.ts'),
      '@gargotte/content-schema': alias('./packages/content-schema/src/index.ts'),
      '@gargotte/save': alias('./packages/save/src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts']
  }
});
