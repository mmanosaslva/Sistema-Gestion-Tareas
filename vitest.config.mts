import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      PORT: '3199',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      DIRECT_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'test-secret-0123456789abcdef0123456789abcdef',
      JWT_EXPIRES_IN: '1h',
    },
  },
});
