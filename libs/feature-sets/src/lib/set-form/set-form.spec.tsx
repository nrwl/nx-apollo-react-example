import React from 'react';
import { render } from '@testing-library/react';

import SetForm from './set-form';

describe(' SetForm', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SetForm />);
    expect(baseElement).toBeTruthy();
  });
});
