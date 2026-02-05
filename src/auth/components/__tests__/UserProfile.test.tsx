import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../shared/test-utils'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'

// Mock UserProfile component for testing
interface UserProfileProps {
  userId?: string;
  editable?: boolean;
  onUpdate?: (userData: any) => void;
}

function UserProfile({ userId, editable = false, onUpdate }: UserProfileProps) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    preferences: {
      notifications: { email: true, sms: false, push: true },
      privacy: { showProfile: true, showContactInfo: false }
    }
  });
  const [updateLoading, setUpdateLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const endpoint = userId ? `/api/users/${userId}` : '/api/auth/profile';
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setUser(data.data);
          setFormData({
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            bio: data.data.bio || '',
            preferences: data.data.preferences || {
              notifications: { email: true, sms: false, push: true },
              privacy: { showProfile: true, showContactInfo: false }
            }
          });
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setFormData({
        firstName: (user as any).firstName || '',
        lastName: (user as any).lastName || '',
        email: (user as any).email || '',
        phone: (user as any).phone || '',
        bio: (user as any).bio || '',
        preferences: (user as any).preferences || {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      });
    }
  };

  const handleSave = async () => {
    setUpdateLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const data = await response.json();
      setUser(data.data);
      setEditing(false);
      onUpdate?.(data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (category: string, key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category as keyof typeof prev.preferences],
          [key]: value
        }
      }
    }));
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error && !user) {
    return <div>Error loading profile: {error}</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const userData = user as any;

  return (
    <div data-testid="user-profile">
      <h2>User Profile</h2>
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      <div className="profile-section">
        <h3>Personal Information</h3>
        
        {editing ? (
          <div className="edit-form">
            <div>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={500}
              />
              <div className="char-count">{formData.bio.length}/500</div>
            </div>
          </div>
        ) : (
          <div className="profile-display">
            <div>
              <strong>Name:</strong> {userData.firstName} {userData.lastName}
            </div>
            <div>
              <strong>Email:</strong> {userData.email}
            </div>
            {userData.phone && (
              <div>
                <strong>Phone:</strong> {userData.phone}
              </div>
            )}
            {userData.bio && (
              <div>
                <strong>Bio:</strong> {userData.bio}
              </div>
            )}
            <div>
              <strong>Role:</strong> {userData.role}
            </div>
            <div>
              <strong>Trust Score:</strong> {userData.trustScore || 0}
            </div>
            <div>
              <strong>Verified:</strong> {userData.isVerified ? 'Yes' : 'No'}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="preferences-section">
          <h3>Preferences</h3>
          
          <div className="notification-preferences">
            <h4>Notifications</h4>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.notifications.email}
                onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
              />
              Email Notifications
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.notifications.sms}
                onChange={(e) => handlePreferenceChange('notifications', 'sms', e.target.checked)}
              />
              SMS Notifications
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.notifications.push}
                onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
              />
              Push Notifications
            </label>
          </div>

          <div className="privacy-preferences">
            <h4>Privacy</h4>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.privacy.showProfile}
                onChange={(e) => handlePreferenceChange('privacy', 'showProfile', e.target.checked)}
              />
              Show Profile Publicly
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.preferences.privacy.showContactInfo}
                onChange={(e) => handlePreferenceChange('privacy', 'showContactInfo', e.target.checked)}
              />
              Show Contact Information
            </label>
          </div>
        </div>
      )}

      {editable && (
        <div className="profile-actions">
          {editing ? (
            <>
              <button 
                onClick={handleSave} 
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button onClick={handleEdit}>Edit Profile</button>
          )}
        </div>
      )}
    </div>
  );
}

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+254712345678',
    bio: 'Software developer passionate about real estate',
    role: 'user',
    trustScore: 85,
    isVerified: true,
    preferences: {
      notifications: { email: true, sms: false, push: true },
      privacy: { showProfile: true, showContactInfo: false }
    }
  };

  describe('Profile Display', () => {
    it('renders user profile information', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile />);

      await waitFor(() => {
        expect(screen.getByText('User Profile')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('+254712345678')).toBeInTheDocument();
        expect(screen.getByText('Software developer passionate about real estate')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching profile', () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return new Promise(() => {
            // Never resolve to keep loading state
          });
        })
      );

      renderWithProviders(<UserProfile />);

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('handles profile fetch error', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<UserProfile />);

      await waitFor(() => {
        expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
      });
    });

    it('handles user not found', async () => {
      server.use(
        http.get('/api/users/999', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      renderWithProviders(<UserProfile userId="999" />);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('renders profile without optional fields', async () => {
      const minimalUser = {
        id: '1',
        email: 'minimal@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        trustScore: 0,
        isVerified: false,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: minimalUser });
        })
      );

      renderWithProviders(<UserProfile />);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('minimal@example.com')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument(); // Not verified
        expect(screen.queryByText('Phone:')).not.toBeInTheDocument();
        expect(screen.queryByText('Bio:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    });

    it('populates form fields with current user data', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+254712345678')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Software developer passionate about real estate')).toBeInTheDocument();
    });

    it('allows editing form fields', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      expect(screen.getByDisplayValue('Johnny')).toBeInTheDocument();
    });

    it('shows character count for bio field', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByText('49/500')).toBeInTheDocument(); // Current bio length
    });

    it('cancels editing and reverts changes', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Changed');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should be back to display mode with original data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    });
  });

  describe('Profile Updates', () => {
    it('successfully saves profile changes', async () => {
      const user = userEvent.setup();
      const mockOnUpdate = vi.fn();
      
      const updatedUser = {
        ...mockUser,
        firstName: 'Johnny',
        lastName: 'Updated'
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        }),
        http.patch('/api/auth/profile', () => {
          return HttpResponse.json({ data: updatedUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} onUpdate={mockOnUpdate} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');
      await user.clear(lastNameInput);
      await user.type(lastNameInput, 'Updated');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Johnny Updated')).toBeInTheDocument();
        expect(mockOnUpdate).toHaveBeenCalledWith(updatedUser);
      });

      // Should be back to display mode
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    });

    it('shows loading state during save', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        }),
        http.patch('/api/auth/profile', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({ data: mockUser }));
            }, 100);
          });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('handles save errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        }),
        http.patch('/api/auth/profile', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Update failed' }),
            { status: 400 }
          );
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Update failed');
      });

      // Should still be in edit mode
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });
  });

  describe('Preferences Management', () => {
    it('displays and allows editing notification preferences', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      
      const emailNotificationCheckbox = screen.getByLabelText(/email notifications/i);
      const smsNotificationCheckbox = screen.getByLabelText(/sms notifications/i);
      const pushNotificationCheckbox = screen.getByLabelText(/push notifications/i);

      expect(emailNotificationCheckbox).toBeChecked();
      expect(smsNotificationCheckbox).not.toBeChecked();
      expect(pushNotificationCheckbox).toBeChecked();

      // Toggle SMS notifications
      await user.click(smsNotificationCheckbox);
      expect(smsNotificationCheckbox).toBeChecked();
    });

    it('displays and allows editing privacy preferences', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      expect(screen.getByText('Privacy')).toBeInTheDocument();
      
      const showProfileCheckbox = screen.getByLabelText(/show profile publicly/i);
      const showContactCheckbox = screen.getByLabelText(/show contact information/i);

      expect(showProfileCheckbox).toBeChecked();
      expect(showContactCheckbox).not.toBeChecked();

      // Toggle contact info visibility
      await user.click(showContactCheckbox);
      expect(showContactCheckbox).toBeChecked();
    });

    it('saves preference changes with profile update', async () => {
      const user = userEvent.setup();
      
      const updatedUser = {
        ...mockUser,
        preferences: {
          notifications: { email: false, sms: true, push: true },
          privacy: { showProfile: true, showContactInfo: true }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        }),
        http.patch('/api/auth/profile', async ({ request }) => {
          const body = await request.json();
          expect(body).toMatchObject({
            preferences: {
              notifications: { email: false, sms: true, push: true },
              privacy: { showProfile: true, showContactInfo: true }
            }
          });
          return HttpResponse.json({ data: updatedUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      // Change preferences
      await user.click(screen.getByLabelText(/email notifications/i)); // Uncheck
      await user.click(screen.getByLabelText(/sms notifications/i)); // Check
      await user.click(screen.getByLabelText(/show contact information/i)); // Check

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Johnny Updated')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await userEvent.setup().click(editButton);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('id', 'firstName');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('id', 'lastName');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('id', 'phone');
      expect(screen.getByLabelText(/bio/i)).toHaveAttribute('id', 'bio');
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        }),
        http.patch('/api/auth/profile', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Validation error' }),
            { status: 400 }
          );
        })
      );

      renderWithProviders(<UserProfile editable={true} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit profile/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveTextContent('Validation error');
      });
    });
  });

  describe('Non-editable Profile View', () => {
    it('does not show edit button when not editable', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(<UserProfile editable={false} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    });

    it('displays public profile for other users', async () => {
      const publicUser = {
        id: '2',
        firstName: 'Jane',
        lastName: 'Public',
        bio: 'Public user bio',
        trustScore: 92,
        isVerified: true,
        role: 'agent'
      };

      server.use(
        http.get('/api/users/2', () => {
          return HttpResponse.json({ data: publicUser });
        })
      );

      renderWithProviders(<UserProfile userId="2" />);

      await waitFor(() => {
        expect(screen.getByText('Jane Public')).toBeInTheDocument();
        expect(screen.getByText('Public user bio')).toBeInTheDocument();
        expect(screen.getByText('92')).toBeInTheDocument();
        expect(screen.getByText('agent')).toBeInTheDocument();
      });

      // Should not show private information like email
      expect(screen.queryByText('Email:')).not.toBeInTheDocument();
    });
  });
});