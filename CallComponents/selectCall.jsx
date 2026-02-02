import React, { useState } from 'react';
import Select from './components/ui/Select/Select';
const App = () => {
  const [formData, setFormData] = useState({
    country: '',
    cities: [],
    category: '',
    tags: [],
  });

  const [errors, setErrors] = useState({});

  // Sample options
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
  ];

  const cities = [
    { value: 'nyc', label: 'New York', description: 'USA' },
    { value: 'lon', label: 'London', description: 'UK' },
    { value: 'tok', label: 'Tokyo', description: 'Japan' },
    { value: 'par', label: 'Paris', description: 'France' },
    { value: 'syd', label: 'Sydney', description: 'Australia' },
    { value: 'ber', label: 'Berlin', description: 'Germany' },
    { value: 'tor', label: 'Toronto', description: 'Canada' },
  ];

  const categories = [
    { value: 'tech', label: 'Technology' },
    { value: 'design', label: 'Design', disabled: true },
    { value: 'business', label: 'Business' },
    { value: 'art', label: 'Art' },
    { value: 'science', label: 'Science' },
  ];

  const tags = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'nextjs', label: 'Next.js' },
  ];

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user selects
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }
    
    if (formData.cities.length === 0) {
      newErrors.cities = 'Please select at least one city';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Select Component Examples</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Basic single select */}
        <Select
          label="Select Country"
          options={countries}
          value={formData.country}
          onChange={(value) => handleChange('country', value)}
          placeholder="Choose a country"
          error={errors.country}
          required
        />

        {/* Multiple select */}
        <Select
          label="Select Cities"
          options={cities}
          value={formData.cities}
          onChange={(value) => handleChange('cities', value)}
          multiple
          placeholder="Choose cities"
          error={errors.cities}
          helperText="Select one or more cities"
          showCount
        />

        {/* Searchable select */}
        <Select
          label="Select Category"
          options={categories}
          value={formData.category}
          onChange={(value) => handleChange('category', value)}
          searchable
          placeholder="Search categories..."
          clearable
        />

        {/* Multiple select with tags display */}
        <Select
          label="Select Technologies"
          options={tags}
          value={formData.tags}
          onChange={(value) => handleChange('tags', value)}
          multiple
          placeholder="Choose technologies"
          clearable
          showCount
        />

        {/* Different sizes */}
        <Select
          label="Small Select"
          options={countries.slice(0, 3)}
          size="small"
          placeholder="Small size"
        />

        <Select
          label="Large Select"
          options={countries.slice(0, 3)}
          size="large"
          placeholder="Large size"
        />

        {/* Disabled select */}
        <Select
          label="Disabled Select"
          options={countries}
          disabled
          placeholder="Cannot select"
        />

        {/* Loading state */}
        <Select
          label="Loading Select"
          options={[]}
          isLoadingOptions={true}
          loadingMessage="Loading options..."
          placeholder="Please wait..."
        />

        {/* With error state */}
        <Select
          label="Error Select"
          options={countries}
          error="This field is required"
          required
        />

        {/* With success state */}
        <Select
          label="Success Select"
          options={countries}
          success="Great choice!"
          value="us"
        />

        {/* Full width */}
        <Select
          label="Full Width Select"
          options={countries}
          fullWidth
          placeholder="Full width select"
        />

        {/* Top positioned dropdown */}
        <Select
          label="Top Dropdown"
          options={countries}
          dropdownPosition="top"
          placeholder="Dropdown appears above"
        />

        {/* With custom messages */}
        <Select
          label="Custom Messages"
          options={[]}
          noOptionsMessage="No items found"
          placeholder="Custom empty state"
        />

        {/* Async search example */}
        <AsyncSearchExample />

        {/* Create new option example */}
        <CreatableSelectExample />

        <button type="submit" style={{ marginTop: '20px' }}>
          Submit Form
        </button>
      </form>
    </div>
  );
};

// Example: Async search select
const AsyncSearchExample = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockResults = [
        { value: `${searchTerm}-1`, label: `${searchTerm} Option 1` },
        { value: `${searchTerm}-2`, label: `${searchTerm} Option 2` },
        { value: `${searchTerm}-3`, label: `${searchTerm} Option 3` },
      ];
      setOptions(mockResults);
      setLoading(false);
    }, 500);
  };

  return (
    <Select
      label="Async Search Select"
      options={options}
      searchable
      onSearch={handleSearch}
      isLoadingOptions={loading}
      placeholder="Type to search..."
    />
  );
};

// Example: Creatable select
const CreatableSelectExample = () => {
  const [options, setOptions] = useState([
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
  ]);
  const [value, setValue] = useState('');

  const handleCreate = (inputValue) => {
    const newOption = {
      value: inputValue.toLowerCase(),
      label: inputValue,
    };
    setOptions(prev => [...prev, newOption]);
    setValue(newOption.value);
  };

  return (
    <Select
      label="Creatable Select"
      options={options}
      value={value}
      onChange={setValue}
      searchable
      onCreateOption={handleCreate}
      placeholder="Type to search or create..."
      onCreateMessage="Add new item"
    />
  );
};

export default App;