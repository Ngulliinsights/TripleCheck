import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileNav } from '../MobileNav';

// Mock the useAccessibility hook
jest.mock('@shared/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    trapFocus: jest.fn(() => jest.fn()),
    announceLiveRegion: jest.fn(),
  }),
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

const renderMobileNav = () => {
  return render(
    <BrowserRouter>
      <MobileNav />
    </BrowserRouter>
  );
};

describe('MobileNav', () => {
  it('renders the menu trigger button', () => {
    renderMobileNav();
    
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('opens the mobile menu when trigger is clicked', () => {
    renderMobileNav();
    
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('closes the mobile menu when close button is clicked', () => {
    renderMobileNav();
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);
    
    // Close menu
    const closeButton = screen.getByRole('button', { name: /close navigation menu/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    renderMobileNav();
    
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
    expect(screen.getByText('List Property')).toBeInTheDocument();
  });

  it('expands and collapses navigation sections', () => {
    renderMobileNav();
    
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);
    
    const propertiesButton = screen.getByRole('button', { name: /properties/i });
    fireEvent.click(propertiesButton);
    
    expect(screen.getByText('All Properties')).toBeInTheDocument();
    expect(screen.getByText('Residential')).toBeInTheDocument();
    expect(screen.getByText('Commercial')).toBeInTheDocument();
    expect(screen.getByText('Land')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    renderMobileNav();
    
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(menuButton);
    
    const searchInput = screen.getByRole('searchbox', { name: /search properties/i });
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });
});