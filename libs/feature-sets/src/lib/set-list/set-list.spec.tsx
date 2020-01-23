import React from 'react';
import { render } from '@testing-library/react';

import SetList from './set-list';

describe(' SetList', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SetList />);
    expect(baseElement).toBeTruthy();
  });
});
