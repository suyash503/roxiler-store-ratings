import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RatingInput, RatingSummary } from './StarRating';

function Controlled({ initial = null, onChange = () => {} }: { initial?: number | null; onChange?: (v: number) => void }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <RatingInput
      label="Your rating for Test Store"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('RatingInput', () => {
  it('is a labelled radio group of five stars', () => {
    render(<Controlled />);
    const group = screen.getByRole('radiogroup', { name: 'Your rating for Test Store' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(0);
  });

  it('submits the clicked star', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'true');
  });

  it('does not resubmit the rating it already has', async () => {
    const onChange = vi.fn();
    render(<Controlled initial={3} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works from the keyboard: one tab stop, arrows and number keys', async () => {
    const onChange = vi.fn();
    render(<Controlled initial={2} onChange={onChange} />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: '2 stars' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(5);
    await userEvent.keyboard('1');
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
  });

  it('ignores input while disabled', async () => {
    const onChange = vi.fn();
    render(<RatingInput label="Rating" value={null} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RatingSummary', () => {
  it('describes the rating once for screen readers', () => {
    render(<RatingSummary value={4.25} count={8} />);
    expect(screen.getByText('Rated 4.3 out of 5 from 8 ratings')).toBeInTheDocument();
  });

  it('says "No ratings yet" instead of zero', () => {
    render(<RatingSummary value={null} count={0} />);
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
  });
});
