import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';

// jsdom không tính layout nên không đo được màu -> contrast được đo riêng (docs/VERIFICATION.md)
async function violations() {
  const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  return results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`);
}

describe('H01: axe-core trên toàn trang', () => {
  it('không có vi phạm ở trạng thái ban đầu', async () => {
    render(<App />);
    expect(await violations()).toEqual([]);
  });

  it('không có vi phạm sau khi sort + chọn dòng', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /GPA/ }));
    await user.click(screen.getAllByRole('gridcell')[0]);
    expect(await violations()).toEqual([]);
  });

  it('không có vi phạm khi không có kết quả lọc', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Tìm kiếm'), 'không tồn tại');
    expect(await violations()).toEqual([]);
  });
});
