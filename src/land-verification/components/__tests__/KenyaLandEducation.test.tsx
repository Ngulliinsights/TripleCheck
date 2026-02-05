import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import KenyaLandEducation from '../KenyaLandEducation'

describe('KenyaLandEducation', () => {
  it('renders education component with default overview section', () => {
    render(<KenyaLandEducation />);
    
    expect(screen.getByText('Kenya Land Ownership Education')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive guide to understanding Kenya\'s land system and protecting your property investments')).toBeInTheDocument();
    expect(screen.getAllByText('Kenya Land System Overview')).toHaveLength(2); // One in nav, one in content
  });

  it('displays all education sections in navigation', () => {
    render(<KenyaLandEducation />);
    
    expect(screen.getAllByText('Kenya Land System Overview')).toHaveLength(2); // One in nav, one in content
    expect(screen.getByText('Land Tenure Types')).toBeInTheDocument();
    expect(screen.getByText('Essential Land Documents')).toBeInTheDocument();
    expect(screen.getByText('Common Land Ownership Challenges')).toBeInTheDocument();
    expect(screen.getByText('Multi-Layered Verification Process')).toBeInTheDocument();
    expect(screen.getByText('Your Rights and Protections')).toBeInTheDocument();
  });

  it('switches to different sections when navigation items are clicked', () => {
    render(<KenyaLandEducation />);
    
    const tenureButton = screen.getByText('Land Tenure Types');
    fireEvent.click(tenureButton);
    
    expect(screen.getByText('Three Main Tenure Types in Kenya')).toBeInTheDocument();
    expect(screen.getByText('1. Freehold Tenure')).toBeInTheDocument();
    expect(screen.getByText('2. Leasehold Tenure')).toBeInTheDocument();
    expect(screen.getByText('3. Customary Tenure')).toBeInTheDocument();
  });

  it('displays document information when documents section is selected', () => {
    render(<KenyaLandEducation />);
    
    const documentsButton = screen.getByText('Essential Land Documents');
    fireEvent.click(documentsButton);
    
    expect(screen.getByText('Key Documents for Land Transactions')).toBeInTheDocument();
    expect(screen.getByText('Title Deed')).toBeInTheDocument();
    expect(screen.getByText('Survey Plan')).toBeInTheDocument();
    expect(screen.getByText('Search Certificate')).toBeInTheDocument();
    expect(screen.getByText('Consent to Transfer')).toBeInTheDocument();
  });

  it('shows land ownership challenges when challenges section is selected', () => {
    render(<KenyaLandEducation />);
    
    const challengesButton = screen.getByText('Common Land Ownership Challenges');
    fireEvent.click(challengesButton);
    
    expect(screen.getByText('Major Land Ownership Risks in Kenya')).toBeInTheDocument();
    expect(screen.getByText('Land Grabbing')).toBeInTheDocument();
    expect(screen.getByText('Double Allocation')).toBeInTheDocument();
    expect(screen.getByText('Succession Disputes')).toBeInTheDocument();
    expect(screen.getByText('Government Acquisition')).toBeInTheDocument();
  });

  it('displays verification process information', () => {
    render(<KenyaLandEducation />);
    
    const processButton = screen.getByText('Multi-Layered Verification Process');
    fireEvent.click(processButton);
    
    expect(screen.getByText('Six-Layer Verification Approach')).toBeInTheDocument();
    expect(screen.getByText('Land Registry Integration')).toBeInTheDocument();
    expect(screen.getByText('Physical Verification')).toBeInTheDocument();
    expect(screen.getByText('Community Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Government Designation Assessment')).toBeInTheDocument();
    expect(screen.getByText('Legal History Investigation')).toBeInTheDocument();
    expect(screen.getByText('Expert Coordination')).toBeInTheDocument();
  });

  it('shows rights and protections information', () => {
    render(<KenyaLandEducation />);
    
    const rightsButton = screen.getByText('Your Rights and Protections');
    fireEvent.click(rightsButton);
    
    expect(screen.getByText('Legal Rights and Protections')).toBeInTheDocument();
    expect(screen.getByText('Constitutional Rights')).toBeInTheDocument();
    expect(screen.getByText('Legal Remedies')).toBeInTheDocument();
    expect(screen.getByText('Professional Support')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Oversight')).toBeInTheDocument();
  });

  it('allows searching through education topics', async () => {
    render(<KenyaLandEducation />);
    
    const searchInput = screen.getByPlaceholderText('Search education topics...');
    fireEvent.change(searchInput, { target: { value: 'tenure' } });
    
    await waitFor(() => {
      expect(screen.getByText('Land Tenure Types')).toBeInTheDocument();
    });
  });

  it('highlights active section in navigation', () => {
    render(<KenyaLandEducation />);
    
    const documentsButton = screen.getByText('Essential Land Documents');
    fireEvent.click(documentsButton);
    
    // Check if the button has active styling
    const buttonElement = documentsButton.closest('button');
    expect(buttonElement).toHaveClass('bg-blue-100', 'text-blue-900', 'border', 'border-blue-200');
  });

  it('starts with specified focus area', () => {
    render(<KenyaLandEducation focusArea="documents" />);
    
    expect(screen.getByText('Key Documents for Land Transactions')).toBeInTheDocument();
  });

  it('displays no content message when search yields no results', async () => {
    render(<KenyaLandEducation />);
    
    const searchInput = screen.getByPlaceholderText('Search education topics...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or select a topic from the sidebar.')).toBeInTheDocument();
    });
  });

  it('contains comprehensive tenure type information', () => {
    render(<KenyaLandEducation />);
    
    const tenureButton = screen.getByText('Land Tenure Types');
    fireEvent.click(tenureButton);
    
    // Check for detailed tenure information
    expect(screen.getByText('Absolute ownership with perpetual rights')).toBeInTheDocument();
    expect(screen.getByText('Temporary ownership for a specified period (usually 99 years)')).toBeInTheDocument();
    expect(screen.getByText('Traditional community-based ownership systems')).toBeInTheDocument();
    expect(screen.getByText('Tenure Conversion Risks')).toBeInTheDocument();
  });

  it('provides detailed document verification guidance', () => {
    render(<KenyaLandEducation />);
    
    const documentsButton = screen.getByText('Essential Land Documents');
    fireEvent.click(documentsButton);
    
    expect(screen.getByText('Document Verification Checklist')).toBeInTheDocument();
    expect(screen.getByText('Authenticity Checks')).toBeInTheDocument();
    expect(screen.getByText('Content Verification')).toBeInTheDocument();
    expect(screen.getByText('Official stamps and seals')).toBeInTheDocument();
  });

  it('includes process timeline information', () => {
    render(<KenyaLandEducation />);
    
    const processButton = screen.getByText('Multi-Layered Verification Process');
    fireEvent.click(processButton);
    
    expect(screen.getByText('Process Timeline')).toBeInTheDocument();
    expect(screen.getByText('Phase 1: Initial (1-2 days)')).toBeInTheDocument();
    expect(screen.getByText('Phase 2: Investigation (3-7 days)')).toBeInTheDocument();
    expect(screen.getByText('Phase 3: Analysis (1-3 days)')).toBeInTheDocument();
  });
});