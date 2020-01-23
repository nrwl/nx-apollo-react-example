import React, { useState } from 'react';

import './set-form.css';
import { useAddSetMutation, SetListDocument} from '@nx-apollo-react-example/data-access';

/* eslint-disable-next-line */
export interface SetFormProps {}

export const SetForm = (props: SetFormProps) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [numParts, setNumParts] = useState(1000);
  
  const [addSetMutation, mutationResult] = useAddSetMutation({
    variables: { name, year, numParts },
    update(cache, { data: { addSet } }) {
      const { allSets } = cache.readQuery({ query: SetListDocument });
      cache.writeQuery({
        query: SetListDocument,
        data: { allSets: allSets.concat([addSet]) }
      });
    }
  });

  const handleSubmit = event => {
    event.preventDefault();
    addSetMutation();
    setName("");
    setYear("");
    setNumParts(1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:{' '}
        <input
          name="name"
          value={name}
          onChange={event => setName(event.target.value)}
        ></input>
      </label>
      <br />
      <label>
        Year:{' '}
        <input
          name="year"
          value={year}
          onChange={event => setYear(event.target.value)}
        ></input>
      </label>
      <br />
      <label>
        Number of Parts:{' '}
        <input
          name="numParts"
          value={numParts}
          onChange={event => setNumParts(+event.target.value)}
        ></input>
      </label>
      <br />
      <button>Create new set</button>
    </form>
  );
};

export default SetForm;