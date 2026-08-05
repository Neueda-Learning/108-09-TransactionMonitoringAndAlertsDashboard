import { render, screen } from '@testing-library/react';
import App from './App';
import { ToastProvider } from './components/Toast';

test('renders dashboard navigation', () => {
  render(
    <ToastProvider>
      <App />
    </ToastProvider>
  );
  const navElement = screen.getByText(/transaction monitoring/i);
  expect(navElement).toBeInTheDocument();
});
