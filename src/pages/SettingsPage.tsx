import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { 
  UserIcon, 
  ScaleIcon, 
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface UserSettings {
  displayName: string;
  weightUnit: 'kg' | 'lbs';
  timezone: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    weightUnit: 'kg',
    timezone: 'enUS'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await cloudFunctionsService.getUserProfile();
      
      setSettings({
        displayName: profile.displayName || user?.displayName || user?.email?.split('@')[0] || '',
        weightUnit: profile.weightUnit || 'kg',
        timezone: profile.timezone || 'UTC'
      });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await cloudFunctionsService.updateUserProfile(settings);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" color="primary" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your account preferences and display options."
      />

      <div className="max-w-2xl">
        <Card>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              Settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={settings.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your display name"
                  />
                </div>
              </div>
            </div>

            {/* Workout Preferences */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ScaleIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Workout Preferences</h3>
              </div>
              
              <div>
                <label htmlFor="weightUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight Unit
                </label>
                <select
                  id="weightUnit"
                  value={settings.weightUnit}
                  onChange={(e) => handleInputChange('weightUnit', e.target.value as 'kg' | 'lbs')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This will be used for all weight displays and inputs throughout the app
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-2"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    Saving Settings...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}