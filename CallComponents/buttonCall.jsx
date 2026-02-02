import { FiArrowRight, FiSave, FiTrash2 } from 'react-icons/fi';

<div>
        {/* Basic usage */}
        <Button onClick={() => console.log('Clicked!')}>
          Click me
        </Button>

        {/* Different variants */}
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="outline">Outline</Button>

        {/* Different sizes */}
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
        <Button size="large">Large</Button>

        {/* With icons */}
        <Button icon={<FiArrowRight />} iconPosition="right">
          Next
        </Button>

        <Button icon={<FiSave />}>
          Save Changes
        </Button>

        {/* Loading state */}
        <Button loading={true}>
          Processing...
        </Button>

        {/* Disabled state */}
        <Button disabled={true}>
          Disabled
        </Button>

        {/* Full width */}
        <Button fullWidth={true}>
          Full Width Button
        </Button>

        {/* Submit button in form */}
        <form onSubmit={(e) => e.preventDefault()}>
          <Button type="submit" variant="success">
            Submit Form
          </Button>
        </form>

        {/* With custom className */}
        <Button className="custom-class" variant="ghost">
          Custom Styled
        </Button>
      </div>