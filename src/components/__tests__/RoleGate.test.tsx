import { render, screen } from '@testing-library/react';
import React from 'react';

describe('RoleGate', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('renders children when allowed', async () => {
    jest.doMock('@/hooks/useSession', () => ({
      useSession: () => ({ data: { userId: 'u1', email: 'a@x.com', role: 'vendor', emailVerified: true }, status: 'authenticated' }),
    }));
    const { RoleGate } = await import('@/components/RoleGate');
    render(
      <RoleGate allow={["vendor", "admin"]}>
        <div data-testid="ok">ok</div>
      </RoleGate>
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('hides children when not allowed', async () => {
    jest.doMock('@/hooks/useSession', () => ({
      useSession: () => ({ data: { userId: 'u1', email: 'a@x.com', role: 'fan', emailVerified: true }, status: 'authenticated' }),
    }));
    const { RoleGate } = await import('@/components/RoleGate');
    const { container } = render(
      <RoleGate allow={["vendor", "admin"]}>
        <div data-testid="ok">ok</div>
      </RoleGate>
    );
    expect(container.querySelector('[data-testid="ok"]')).toBeNull();
  });
});
