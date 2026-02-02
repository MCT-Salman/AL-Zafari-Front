import React, { useState } from 'react';
import Box from './components/ui/Box/Box';
import Button from './components/ui/Button/Button';
import Input from './components/ui/Input/Input';
import Select from './components/ui/Select/Select';
import { FiUser, FiMail, FiSettings, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Box Component Examples</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Basic Card */}
        <Box
          title="Basic Card"
          subtitle="A simple box with default styling"
          padding="medium"
          shadow="md"
          radius="medium"
          hoverable
        >
          <p>This is a basic card component. You can put any content inside.</p>
          <Button variant="primary">Action</Button>
        </Box>

        {/* Primary Card */}
        <Box
          variant="primary"
          title="Primary Card"
          subtitle="Important information"
          padding="large"
          radius="large"
        >
          <p>This card uses the primary variant for highlighting important content.</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button variant="light">Cancel</Button>
            <Button variant="light">Confirm</Button>
          </div>
        </Box>

        {/* Danger Card */}
        <Box
          variant="danger"
          title="Error Alert"
          subtitle="Something went wrong"
          padding="medium"
          radius="medium"
        >
          <p>There was an error processing your request. Please try again.</p>
          <Button variant="light" style={{ marginTop: '12px' }}>
            Retry
          </Button>
        </Box>

        {/* Success Card */}
        <Box
          variant="success"
          title="Success!"
          subtitle="Operation completed successfully"
          padding="medium"
        >
          <p>Your changes have been saved successfully.</p>
        </Box>

        {/* Outline Card */}
        <Box
          variant="outline"
          title="Outline Style"
          subtitle="With border and transparent background"
          padding="large"
          border="thin"
          radius="medium"
        >
          <p>This card has an outline style with a border.</p>
        </Box>

        {/* Glass Effect */}
        <Box
          variant="glass"
          title="Glass Morphism"
          subtitle="Modern design effect"
          padding="large"
          radius="large"
          style={{ background: 'rgba(255, 255, 255, 0.2)' }}
        >
          <p>Glass effect with backdrop blur. Looks great on images.</p>
        </Box>

        {/* Clickable Card */}
        <Box
          title="Clickable Card"
          subtitle="Click to perform action"
          padding="medium"
          shadow="sm"
          radius="medium"
          clickable
          hoverable
          onClick={() => alert('Card clicked!')}
        >
          <p>This entire card is clickable. Try clicking it!</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ color: '#666' }}>Click anywhere</span>
            <FiChevronRight />
          </div>
        </Box>

        {/* Card with Custom Header */}
        <Box
          padding="medium"
          shadow="md"
          radius="medium"
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiSettings size={24} />
              <div>
                <h3 style={{ margin: 0 }}>Settings</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Manage your preferences</p>
              </div>
            </div>
          }
          actions={
            <Button size="small" variant="ghost">
              Edit
            </Button>
          }
          divider
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label>
              <input type="checkbox" /> Enable notifications
            </label>
            <label>
              <input type="checkbox" /> Dark mode
            </label>
            <label>
              <input type="checkbox" /> Auto-save
            </label>
          </div>
        </Box>

        {/* Loading Card */}
        <Box
          title="Loading Card"
          subtitle="Fetching data..."
          padding="medium"
          shadow="md"
          radius="medium"
          loading={loading}
        >
          <p>This card shows a loading state when active.</p>
          <Button onClick={handleClick} disabled={loading}>
            {loading ? 'Loading...' : 'Simulate Load'}
          </Button>
        </Box>

        {/* Stats Card */}
        <Box
          padding="large"
          shadow="lg"
          radius="large"
          background="gradient"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>1,234</div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Users</div>
            <div style={{ fontSize: '0.875rem', marginTop: '8px', opacity: 0.8 }}>↑ 12% from last month</div>
          </div>
        </Box>

        {/* Form Card */}
        <Box
          as="form"
          title="Contact Form"
          subtitle="Send us a message"
          padding="large"
          shadow="md"
          radius="large"
          gap="medium"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Form submitted!');
          }}
        >
          <Input
            label="Name"
            placeholder="Your name"
            icon={<FiUser />}
            required
          />
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            icon={<FiMail />}
            required
          />
          <Input
            label="Message"
            placeholder="Your message..."
            multiline
            rows={4}
          />
          <Box direction="row" justify="end" gap="small">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Send Message
            </Button>
          </Box>
        </Box>

        {/* Tabs Card */}
        <Box
          title="User Profile"
          padding="none"
          shadow="md"
          radius="medium"
          overflow="hidden"
        >
          <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef' }}>
            {['dashboard', 'settings', 'billing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #007bff' : 'none',
                  color: activeTab === tab ? '#007bff' : '#666',
                  fontWeight: activeTab === tab ? '600' : '400',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Box padding="large">
            {activeTab === 'dashboard' && <p>Dashboard content goes here...</p>}
            {activeTab === 'settings' && <p>Settings content goes here...</p>}
            {activeTab === 'billing' && <p>Billing content goes here...</p>}
          </Box>
        </Box>

        {/* Alert Box */}
        <Box
          variant="warning"
          padding="medium"
          radius="medium"
          direction="row"
          align="center"
          gap="medium"
        >
          <FiAlertCircle size={24} />
          <div>
            <div style={{ fontWeight: '600' }}>Warning</div>
            <div style={{ fontSize: '14px' }}>This action cannot be undone. Proceed with caution.</div>
          </div>
        </Box>

        {/* Nested Boxes */}
        <Box
          title="Nested Layout"
          subtitle="Boxes within boxes"
          padding="large"
          shadow="md"
          radius="medium"
          gap="medium"
        >
          <Box
            padding="medium"
            background="light"
            radius="small"
            hoverable
          >
            <div style={{ fontWeight: '600' }}>Feature 1</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Description of feature 1</div>
          </Box>
          <Box
            padding="medium"
            background="light"
            radius="small"
            hoverable
          >
            <div style={{ fontWeight: '600' }}>Feature 2</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Description of feature 2</div>
          </Box>
          <Box
            padding="medium"
            background="light"
            radius="small"
            hoverable
          >
            <div style={{ fontWeight: '600' }}>Feature 3</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Description of feature 3</div>
          </Box>
        </Box>

        {/* Sidebar Panel */}
        <Box
          title="Filters"
          padding="medium"
          shadow="md"
          radius="medium"
          fullHeight
          style={{ minHeight: '400px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category</label>
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'tech', label: 'Technology' },
                  { value: 'design', label: 'Design' },
                  { value: 'business', label: 'Business' },
                ]}
                placeholder="Select category"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Price Range</label>
              <Input type="range" min="0" max="1000" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Date Range</label>
              <Input type="date" />
              <Input type="date" style={{ marginTop: '8px' }} />
            </div>
            <Button variant="primary" fullWidth>
              Apply Filters
            </Button>
          </div>
        </Box>

        {/* Empty State */}
        <Box
          padding="xlarge"
          shadow="none"
          border="dashed"
          radius="medium"
          align="center"
          justify="center"
          style={{ minHeight: '200px', borderColor: '#dee2e6' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: '#dee2e6', marginBottom: '16px' }}>📁</div>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>No data available</div>
            <div style={{ color: '#6c757d', marginBottom: '16px' }}>Get started by adding some content</div>
            <Button variant="outline">Add Content</Button>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default App;