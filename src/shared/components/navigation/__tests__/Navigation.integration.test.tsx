import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Navigation } from '../../../components/layout/Navigation'

// Mock the MobileNav component
jest.mock('../MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile Nav</div>,
}));

// Mock the Logo and Wordmark components
jest.mock('@shared/components/ui/logo', () => ({
  Logo: ({ onClick }: { onClick?: () => void }) => (
    <div data-testid="logo" onClick={onClick}>Logo</div>
  ),
}));

jest.mock('@shared/components/ui/wordmark', () => ({
  Wordmark: ({ onClick }: { onClick?: () => void }) => (
    <div data-testid="wordmark" onClick={onClick}>Wordmark</div>
  ),
}));

const renderNavigation = () => {
  return render(
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  );
};

describe('Navigation Integration', () => {
  it('renders without crashing', () => {
    renderNavigation();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows desktop navigation items', () => {
    renderNavigation();
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('shows mobile navigation component', () => {
    renderNavigation();
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('handles dropdown interactions without hanging', async () => {
    renderNavigation();
    
    const propertiesButton = screen.getByRole('button', { name: /properties/i });
    
    // Test hover interaction
    fireEvent.mouseEnter(propertiesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Browse Properties')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Test mouse leave
    fireEvent.mouseLeave(propertiesButton);
    
    // Should close after delay
    await waitFor(() => {
      expect(screen.queryByText('Browse Properties')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('handles search functionality', () => {
    renderNavigation();
    
    const searchInput = screen.getByPlaceholderText('Search properties...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });

  it('shows authentication buttons when not logged in', () => {
    renderNavigation();
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});