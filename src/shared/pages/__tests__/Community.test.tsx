import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Community from '../Community'

// Mock the hooks
vi.mock('../hooks/useDebounce', () => ({
  useDebounce: vi.fn((value) => ({ debouncedValue: value })),
}));

vi.mock('../hooks/usePagination', () => ({
  useInfiniteScroll: vi.fn(() => ({ targetRef: { current: null } })),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Community Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the community page with correct title', async () => {
    renderWithProviders(<Community />);
    
    expect(screen.getByText('Real Estate Fraud Community')).toBeInTheDocument();
    expect(screen.getByText(/Share your experiences, learn from others/)).toBeInTheDocument();
  });

  it('displays statistics cards', async () => {
    renderWithProviders(<Community />);
    
    await waitFor(() => {
      expect(screen.getByText('234')).toBeInTheDocument();
      expect(screen.getByText('Stories Shared')).toBeInTheDocument();
      expect(screen.getByText('89')).toBeInTheDocument();
      expect(screen.getByText('Cases Resolved')).toBeInTheDocument();
    });
  });

  it('switches between browse and share tabs', async () => {
    renderWithProviders(<Community />);
    
    const shareTab = screen.getByText('Share Experience');
    fireEvent.click(shareTab);
    
    await waitFor(() => {
      expect(screen.getByText('Share Your Experience')).toBeInTheDocument();
    });
  });

  it('renders search functionality', async () => {
    renderWithProviders(<Community />);
    
    const searchInput = screen.getByPlaceholderText('Search stories...');
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'fraud' } });
    expect(searchInput).toHaveValue('fraud');
  });

  it('displays category filters', async () => {
    renderWithProviders(<Community />);
    
    await waitFor(() => {
      expect(screen.getByText('All Stories')).toBeInTheDocument();
      expect(screen.getByText('Land Purchase')).toBeInTheDocument();
      expect(screen.getByText('Rental Fraud')).toBeInTheDocument();
    });
  });
});