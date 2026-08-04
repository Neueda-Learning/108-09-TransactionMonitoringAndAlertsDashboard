import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard navigation', () => {
  render(<App />);
  const navElement = screen.getByText(/transaction monitoring/i);
  expect(navElement).toBeInTheDocument();
});
