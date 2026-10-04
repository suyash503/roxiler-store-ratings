import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reports the trimmed text only after typing pauses', () => {
    const onChange = vi.fn();
    render(<SearchInput label="Search stores" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Search stores');

    fireEvent.change(input, { target: { value: 'pu' } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: 'pune ' } });
    act(() => vi.advanceTimersByTime(299));
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('pune');
  });

  it('keeps a trailing space while typing when the parent echoes the trimmed value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchInput label="Search stores" value="" onChange={onChange} />);
    const input = screen.getByLabelText('Search stores');
    fireEvent.change(input, { target: { value: 'blue ' } });
    rerender(<SearchInput label="Search stores" value="blue" onChange={onChange} />);
    expect(input).toHaveValue('blue ');
  });

  it('follows outside changes such as "Clear filters"', () => {
    const { rerender } = render(<SearchInput label="Search stores" value="pune" onChange={() => {}} />);
    rerender(<SearchInput label="Search stores" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Search stores')).toHaveValue('');
  });

  it('clears immediately with the clear button', () => {
    const onChange = vi.fn();
    render(<SearchInput label="Search stores" value="pune" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search stores' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.getByLabelText('Search stores')).toHaveValue('');
  });
});
