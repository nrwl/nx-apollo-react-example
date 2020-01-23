import React from 'react';
import { render } from '@testing-library/react';

import FeatureSets from './feature-sets';

describe(' FeatureSets', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<FeatureSets />);
    expect(baseElement).toBeTruthy();
  });
});
