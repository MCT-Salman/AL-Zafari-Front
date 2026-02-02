import React, { useState } from 'react';
import Switch from './components/ui/Switch/Switch';
import { FiSun, FiMoon, FiWifi, FiBell, FiCheck, FiX } from 'react-icons/fi';

const App = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    wifi: false,
    twoFactor: false,
    analytics: true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    console.log(`${name} changed to: ${value}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!settings.twoFactor) {
      newErrors.twoFactor = 'Two-factor authentication is required for security';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Settings saved:', settings);
      alert('Settings saved successfully!');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Switch Component Examples</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Switch */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Basic Switches</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Enable Notifications"
              checked={settings.notifications}
              onChange={(e, checked) => handleChange('notifications', checked)}
            />
            
            <Switch
              label="Auto-save documents"
              checked={settings.autoSave}
              onChange={(e, checked) => handleChange('autoSave', checked)}
            />
          </div>
        </div>

        {/* Different Sizes */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Different Sizes</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Switch
              label="Small"
              size="small"
              checked={settings.wifi}
              onChange={(e, checked) => handleChange('wifi', checked)}
            />
            
            <Switch
              label="Medium (default)"
              checked={settings.wifi}
              onChange={(e, checked) => handleChange('wifi', checked)}
            />
            
            <Switch
              label="Large"
              size="large"
              checked={settings.wifi}
              onChange={(e, checked) => handleChange('wifi', checked)}
            />
          </div>
        </div>

        {/* Variants */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Color Variants</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '16px' }}>
            <Switch
              label="Primary"
              variant="primary"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Success"
              variant="success"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Danger"
              variant="danger"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Warning"
              variant="warning"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Info"
              variant="info"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Secondary"
              variant="secondary"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Dark"
              variant="dark"
              checked={true}
              onChange={() => {}}
            />
            
            <Switch
              label="Light"
              variant="light"
              checked={true}
              onChange={() => {}}
            />
          </div>
        </div>

        {/* With Icons */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Switches with Icons</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Dark Mode"
              icons
              checkedIcon={<FiMoon size={12} />}
              uncheckedIcon={<FiSun size={12} />}
              checked={settings.darkMode}
              onChange={(e, checked) => handleChange('darkMode', checked)}
            />
            
            <Switch
              label="Wi-Fi"
              icons
              checkedIcon={<FiWifi size={12} />}
              uncheckedIcon={<FiWifi size={12} />}
              checked={settings.wifi}
              onChange={(e, checked) => handleChange('wifi', checked)}
            />
            
            <Switch
              label="Enable Feature"
              icons
              checkedIcon={<FiCheck size={12} />}
              uncheckedIcon={<FiX size={12} />}
            />
          </div>
        </div>

        {/* Label Positions */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Label Positions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Label on right (default)"
              labelPosition="right"
              checked={settings.analytics}
              onChange={(e, checked) => handleChange('analytics', checked)}
            />
            
            <Switch
              label="Label on left"
              labelPosition="left"
              checked={settings.analytics}
              onChange={(e, checked) => handleChange('analytics', checked)}
            />
            
            <Switch
              label="Label on top"
              labelPosition="top"
              checked={settings.analytics}
              onChange={(e, checked) => handleChange('analytics', checked)}
            />
            
            <Switch
              label="Label on bottom"
              labelPosition="bottom"
              checked={settings.analytics}
              onChange={(e, checked) => handleChange('analytics', checked)}
            />
          </div>
        </div>

        {/* States */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Different States</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="Disabled (unchecked)"
              disabled
            />
            
            <Switch
              label="Disabled (checked)"
              checked
              disabled
            />
            
            <Switch
              label="Loading state"
              loading
              checked={settings.autoSave}
              onChange={(e, checked) => handleChange('autoSave', checked)}
            />
            
            <Switch
              label="Required field"
              required
              checked={settings.twoFactor}
              onChange={(e, checked) => handleChange('twoFactor', checked)}
              error={errors.twoFactor}
            />
          </div>
        </div>

        {/* Validation States */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Validation States</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Switch
              label="With error message"
              error="This field is required"
            />
            
            <Switch
              label="With success message"
              success="Setting saved successfully"
              checked
            />
            
            <Switch
              label="With warning message"
              warning="This may affect performance"
              checked
            />
            
            <Switch
              label="With helper text"
              helperText="Turn on to receive email notifications"
            />
          </div>
        </div>

        {/* Custom Color */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Custom Color</h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Switch
              label="Purple"
              color="#8b5cf6"
              checked
            />
            
            <Switch
              label="Pink"
              color="#ec4899"
              checked
            />
            
            <Switch
              label="Teal"
              color="#14b8a6"
              checked
            />
            
            <Switch
              label="Orange"
              color="#f97316"
              checked
            />
          </div>
        </div>

        {/* Form Integration */}
        <div style={{ marginBottom: '24px' }}>
          <h3>Form Integration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <Switch
              name="emailNotifications"
              label="Email Notifications"
              checked={settings.notifications}
              onChange={(e, checked) => handleChange('notifications', checked)}
              helperText="Receive email notifications for important updates"
            />
            
            <Switch
              name="twoFactorAuth"
              label="Two-Factor Authentication"
              required
              checked={settings.twoFactor}
              onChange={(e, checked) => handleChange('twoFactor', checked)}
              error={errors.twoFactor}
              helperText="Add an extra layer of security to your account"
            />
            
            <Switch
              name="marketingEmails"
              label="Marketing Emails"
              checked={settings.analytics}
              onChange={(e, checked) => handleChange('analytics', checked)}
              helperText="Receive promotional emails and updates"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '32px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default App;