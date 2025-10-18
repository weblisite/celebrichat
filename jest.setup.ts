import '@testing-library/jest-dom/extend-expect';

// Global mock for database client to avoid real DB calls in tests
// Individual tests can override implementations as needed by using jest.requireMock('@/db/client')
jest.mock('@/db/client', () => {
  const noop = async () => [];
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: noop,
    values: () => chain,
    set: () => chain,
    returning: noop,
  } as any;

  const db = {
    select: jest.fn(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    })),
    insert: jest.fn(() => ({
      values: () => ({
        returning: async () => [],
      }),
    })),
    update: jest.fn(() => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    })),
  } as any;

  return { db };
});
