import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HelpSystem from '../HelpSystem';

describe('HelpSystem', () => {
  it('renders help system with default overview tab', () => {
    render(<HelpSystem />);
    
    expect(screen.getByText('Land Verification Help')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('displays contextual guide when currentContext is provided', () => {
    render(<HelpSystem currentContext="document-upload" />);
    
    expect(screen.getByText('Uploading Land Documents')).toBeInTheDocument();
    expect(screen.getByText('Upload your title deed, survey plan, and any supporting documents for verification.')).toBeInTheDocument();
  });

  it('allows searching through help content', async () => {
    render(<HelpSystem />);
    
    const searchInput = screen.getByPlaceholderText('Search help topics...');
    fireEvent.change(searchInput, { target: { value: 'verification' } });
    
    await waitFor(() => {
      expect(screen.getByText('Kenya Land Verification Overview')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', () => {
    render(<HelpSystem />);
    
    const risksTab = screen.getByText('Risks');
    fireEvent.click(risksTab);
    
    expect(screen.getByText('Understanding Land Verification Risks')).toBeInTheDocument();
  });

  it('displays detailed content when help item is clicked', () => {
    render(<HelpSystem />);
    
    const overviewItem = screen.getByText('Kenya Land Verification Overview');
    fireEvent.click(overviewItem);
    
    expect(screen.getByText('Multi-Layered Verification Approach')).toBeInTheDocument();
  });

  it('shows related topics for selected content', () => {
    render(<HelpSystem />);
    
    const overviewItem = screen.getByText('Kenya Land Verification Overview');
    fireEvent.click(overviewItem);
    
    expect(screen.getByText('Related Topics')).toBeInTheDocument();
  });

  it('closes contextual guide when X button is clicked', () => {
    render(<HelpSystem currentContext="document-upload" />);
    
    const closeButton = screen.getAllByRole('button').find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('h-4 w-4')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(screen.queryByText('Uploading Land Documents')).not.toBeInTheDocument();
    }
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<HelpSystem onClose={onClose} />);
    
    // Find the close button by its SVG content (X icon)
    const closeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-x')
    );
    
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('renders in embedded mode without modal wrapper', () => {
    render(<HelpSystem embedded={true} />);
    
    // Should not have modal overlay
    expect(screen.queryByText('Land Verification Help')).not.toBeInTheDocument();
    // Should still have content
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('displays tips, warnings, and next steps in contextual guide', () => {
    render(<HelpSystem currentContext="physical-verification" />);
    
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Important Notes')).toBeInTheDocument();
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
  });

  it('filters content based on search term and category', async () => {
    render(<HelpSystem />);
    
    // Switch to risks tab
    const risksTab = screen.getByText('Risks');
    fireEvent.click(risksTab);
    
    // Search for specific risk type
    const searchInput = screen.getByPlaceholderText('Search help topics...');
    fireEvent.change(searchInput, { target: { value: 'ownership' } });
    
    await waitFor(() => {
      expect(screen.getByText('Understanding Land Verification Risks')).toBeInTheDocument();
    });
  });

  it('handles empty search results gracefully', async () => {
    render(<HelpSystem />);
    
    const searchInput = screen.getByPlaceholderText('Search help topics...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      // Should show no results or empty state
      const helpItems = screen.queryAllByRole('button').filter(button => 
        button.textContent?.includes('Kenya Land')
      );
      expect(helpItems).toHaveLength(0);
    });
  });
});