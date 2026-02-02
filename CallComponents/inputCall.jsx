import { FiUser, FiMail, FiLock, FiSearch, FiCalendar } from 'react-icons/fi';
import Input from './components/Input/Input';
import { useRef, useState } from 'react';
function App() {

 const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    search: '',
    bio: '',
  });
  
  const [errors, setErrors] = useState({});
  const inputRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    <>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Input Component Examples</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Basic text input with label */}
        <Input
          name="username"
          label="Username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          icon={<FiUser />}
          required
        />

        {/* Email input with validation */}
        <Input
          type="email"
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={<FiMail />}
          helperText="We'll never share your email"
        />

        {/* Password input */}
        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={<FiLock />}
        />

        {/* Search input with clear button */}
        <Input
          type="search"
          name="search"
          label="Search"
          placeholder="Search..."
          value={formData.search}
          onChange={handleChange}
          icon={<FiSearch />}
          iconPosition="right"
          clearable
        />

        {/* Textarea */}
        <Input
          name="bio"
          label="Biography"
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChange={handleChange}
          multiline
          rows={4}
        />

        {/* Different sizes */}
        <Input
          label="Small Input"
          size="small"
          placeholder="Small size"
        />
        
        <Input
          label="Large Input"
          size="large"
          placeholder="Large size"
        />

        {/* Success state */}
        <Input
          label="Valid Input"
          value="Valid value"
          success="Looks good!"
        />

        {/* Warning state */}
        <Input
          label="Warning Input"
          value="Some warning"
          warning="Please double-check this value"
        />

        {/* Disabled input */}
        <Input
          label="Disabled Input"
          value="Cannot edit this"
          disabled
        />

        {/* Number input */}
        <Input
          type="number"
          label="Age"
          min="0"
          max="120"
          step="1"
        />

        {/* Date input */}
        <Input
          type="date"
          label="Birthday"
          icon={<FiCalendar />}
        />

        {/* Full width */}
        <Input
          label="Full Width Input"
          fullWidth
          placeholder="This input takes full width"
        />

        {/* With ref */}
        <Input
          ref={inputRef}
          label="Input with Ref"
          placeholder="Focus me programmatically"
        />

        <button type="submit" style={{ marginTop: '20px' }}>
          Submit Form
        </button>
      </form>
    </div>
    </>
  )
}

export default App
