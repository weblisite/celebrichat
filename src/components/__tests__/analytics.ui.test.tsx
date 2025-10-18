import React from 'react';
import { render } from '@testing-library/react';
import { SummaryCards } from '@/components/analytics/SummaryCards';
import { TrendChart } from '@/components/analytics/TrendChart';
import { PayoutStatus } from '@/components/analytics/PayoutStatus';

describe('Analytics UI components', () => {
  it('SummaryCards snapshot', () => {
    const { container } = render(
      <SummaryCards totals={{ salesCents: 123456, ticketsSold: 42, liveChatCents: 7890, vendorFeesCents: 5000 }} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('TrendChart snapshot', () => {
    const { container } = render(
      <TrendChart
        data={[
          { date: '2024-01-10', salesCents: 10000, tickets: 3, liveChatCents: 400 },
          { date: '2024-01-11', salesCents: 18000, tickets: 5, liveChatCents: 600 },
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('PayoutStatus snapshot', () => {
    const { container } = render(<PayoutStatus data={{ pending: 2, ready: 1, paid: 5 }} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
