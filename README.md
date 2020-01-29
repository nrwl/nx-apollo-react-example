# Nx Apollo React Example

This project was generated using [Nx](https://nx.dev).

<p align="center"><img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" width="450"></p>

🔎 **Nx is a set of Extensible Dev Tools for Monorepos.**

## Run demo
GraphQL API
- `npm start api`

[React](https://reactjs.org)
- `npm start nx-apollo`

## What you’ll create
In this article, you will build a simple GraphQL API that tracks some information about Lego sets. You’ll create this API using NestJS, and it will be consumed by a React application. You’ll have this all inside of an Nx Workspace in a single repository.

## What you’ll learn
In this article, you’ll learn how to:

* Create an Nx workspace for both frontend and backend applications
* Create a GraphQL API using NestJS
* Autogenerate frontend code based on your GraphQL schema
* Create a React application to consume your GraphQL api


## Create a new workspace

Start by creating an Nx workspace:

`npx create-nx-workspace nx-apollo-react-example`

When prompted, answer the prompts as follows:

```bash
? What to create in the new workspace react [a workspace with a 
single React application]
? Application name                    nx-apollo
? Default stylesheet format           CSS
```

## Create GraphQL API
Use the NestJS framework to create your GraphQL API. First, add NestJS to your Nx workspace and create an application:

`npm install --save-dev @nrwl/nest`

`nx generate @nrwl/nest:application api`

When prompted for a directory, press enter. This will place the api application in the root of your apps directory.

Once the application is created, install the GraphQL modules needed for Nest:

`npm install @nestjs/graphql apollo-server-express graphql-tools graphql`

You need a GraphQL schema to create the API, so write a very simple one with a single query and a single mutation. Create a file named `schema.graphql` in the api application:


```
// apps/api/src/app/schema.graphql

type Set {
    id: Int!
    name: String
    year: Int
    numParts: Int
}

type Query {
    allSets: [Set]
}

type Mutation {
    addSet(name: String, year: String, numParts: Int): Set
}
```

Import the `GraphQLModule` and use that schema in NestJS.

```typescript
// apps/api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql']
    })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

This is already enough to see some progress when you run the `api` application.

`npm start api`

When the application is running, bring up the GraphQL Playground in your browser at [http://localhost:3333/graphql](http://localhost:3333/graphql)

Here you can inspect your GraphQL schema as well as submit queries. The queries don’t return anything right now because no data has been provided. You need a resolver to do that. Create a new file in your `api` project called `set.resolver.ts`. Then add this code:

```typescript
// apps/api/src/app/set.resolver.ts

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

export interface SetEntity {
  id: number;
  name: string;
  numParts: number;
  year: string;
}

@Resolver('Set')
export class SetResolver {
  private sets: SetEntity[] = [
    {
      id: 1,
      name: 'Voltron',
      numParts: 2300,
      year: '2019'
    },
    {
      id: 2,
      name: 'Ship in a Bottle',
      numParts: 900,
      year: '2019'
    }
  ];

  @Query('allSets')
  getAllSets(): SetEntity[] {
    return this.sets;
  }

  @Mutation()
  addSet(
    @Args('name') name: string,
    @Args('year') year: string,
    @Args('numParts') numParts: number
  ) {
    const newSet = {
      id: this.sets.length + 1,
      name,
      year,
      numParts: +numParts
    };

    this.sets.push(newSet);

    return newSet;
  }
}
```

This is a very simple resolver that holds data in memory. It returns the current contents of the `sets` array for the `allSets` query and allows users to add a new set using the `addSet` mutation. Add this resolver to the `providers` array in your app module:

```typescript
// apps/api/src/app/app.module.ts

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SetResolver } from './set.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql']
    })
  ],
  controllers: [AppController],
  providers: [AppService, SetResolver]
})
export class AppModule {}
```

Go back to your GraphQL Playground and see if your queries return any data now. Try a query and a mutation:

```
query allSets {
  allSets{
    id,
    name,
    numParts
  }
}

mutation addSet {
  addSet(name: "My New Set", numParts: 200, year: "2020") {
    id
 }
}
```

Now that the API is working, you’re ready to build a frontend to access this.

## Add Apollo Client to  React App

The Apollo client makes it easy to consume your GraphQL API. Install the react version of the client:

`npm install apollo-boost @apollo/react-hooks graphql`

Modify your `app.tsx` to provide the Apollo Client:

```typescript
// apps/nx-apollo/src/app/app.tsx

import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient from 'apollo-boost';
import React from 'react';
import './app.css';

const client = new ApolloClient({
  uri: 'http://localhost:3333/graphql'
});

const App = () => (
  <ApolloProvider client={client}>
    <h1>My Lego Sets</h1>
  </ApolloProvider>
);

export default App;
```

## Create React libraries
Nx helps you break down your code into well-organized libraries for consumption by apps, so create a couple of React libraries to organize your work. Create a data-access library that handles communication with the backend and a feature-sets library that includes container components for displaying the Lego set data. In a real app, you might also create a ui library that includes reusable presentational components, but that is not part of this example. For more information on how to organize your React monorepo using Nx, read our book *Effective React Development with Nx* by registering at [Nrwl Connect](https://connect.nrwl.io/).

To create the described libraries, run these commands:

`nx generate @nrwl/react:library data-access --style css`

`nx generate @nrwl/react:library feature-sets --style css`

## Setup React Code Generation
A tool called GraphQL Code Generator makes the development of your data-access library faster. As always, install dependencies first:

`npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo`

You need to create some GraphQL queries and mutations for the frontend to consume. Create a folder named `graphql` in your `data-access` library with a file inside called `operations.graphql`:

```
# libs/data-access/src/lib/graphql/operations.graphql

query setList {
  allSets{
    id
    name
    numParts
    year
  }
}


mutation addSet($name: String!, $year: String!, $numParts: Int!) {
  addSet(name: $name, year: $year, numParts: $numParts) {
    id
    name
    numParts
    year
  }
}
```

Create a file named `codegen.yml` in the data-access library to configure the code generator:

```yaml
# libs/data-access/codegen.yml

overwrite: true
schema: "apps/api/src/app/schema.graphql"
generates:
  libs/data-access/src/lib/generated/generated.tsx:
    documents: "libs/data-access/src/lib/**/*.graphql"
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-react-apollo"
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

This configuration grabs all of your GraphQL files and generates all of the needed types and services to consume the API.

Add a new task in `workspace.json` to run this code generator:

```json
// workspace.json

{
  "version": 1,
  "projects": {
    "react-data-access": {
      ...
      "architect": {
        ...
        "generate": {
          "builder": "@nrwl/workspace:run-commands",
          "options": {
            "commands": [
              {
                "command": "npx graphql-codegen --config libs/data-access/codegen.yml"
              }
            ]
          }
        }
      }
    },
    ...
}
```

Now we can run that using the Nx CLI:

`nx run data-access:generate`

You should now have a folder called `generated` in your `data-access` library with a file named `generated.ts.` It contains typing information about the GraphQL schema and the operations you defined. It even has some hooks that make consuming this API super-fast.

To make these available to consumers, export them in the `index.ts` of the data-access library:

```typescript
// libs/data-access/src/index.ts

export * from './lib/data-access';
export * from './lib/generated/generated';
```

## Create React components
You now have everything needed to start building your React components. Create two components: a list of Lego sets and a form to add a Lego set. Use the Nx CLI to scaffold these:

`nx generate @nrwl/react:component --name=SetList --export --project=feature-sets --style=css`

`nx generate @nrwl/react:component --name=SetForm --export --project=feature-sets --style=css`

In the `SetList` component, add the following:

```typescript
// libs/feature-sets/src/lib/set-list/set-list.tsx

import React from 'react';

import './set-list.css';
import { useSetListQuery } from '@nx-apollo-react-example/data-access';

/* eslint-disable-next-line */
export interface SetListProps {}

export const SetList = (props: SetListProps) => {
  const { loading, error, data } = useSetListQuery();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <ul>
      {data.allSets.map(({ id, name, numParts, year }) => (
        <li key={id}>
          {year} - <strong>{name}</strong> ({numParts} parts)
        </li>
      ))}
    </ul>
  );
};

export default SetList;
```

```css
/* libs/feature-sets/src/lib/set-list/set-list.css */

ul {
  list-style: none;
  margin: 0;
  font-family: sans-serif;
  width: 100%;
}

li {
  padding: 8px;
}

li:nth-child(2n) {
  background-color: #eee;
}

span.year {
  display: block;
  width: 20%;
}
```

Notice how `useSetListQuery` is imported from the `data-access` library. This is a hook generated by GraphQL Code Generator that provides the results of the `SetList` query. This entire pipeline is type-safe, using the types generated by GraphQL Code Generator.

In the `SetForm` component, add the following:

```typescript
// libs/feature-sets/src/lib/set-form/set-form.tsx

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
```

```css
/* libs/feature-sets/src/lib/set-form/set-form.css */

form {
    font-family: sans-serif;
    border: solid 1px #eee;
    max-width: 240px;
    padding: 24px;
}

input {
    display: block;
    margin-bottom: 8px;
}
```

Again, notice that the component imports hooks, queries, and typing information from our `data-access` library to accomplish this.

## Integrate components into app

Final step: bring those new components into the app component and add a little styling:

```typescript
// apps/nx-apollo/src/app/app.tsx

import { ApolloProvider } from '@apollo/react-hooks';
import { SetForm, SetList } from '@nx-apollo-react-example/feature-sets';
import ApolloClient from 'apollo-boost';
import React from 'react';
import './app.css';

const client = new ApolloClient({
  uri: 'http://localhost:3333/graphql'
});

const App = () => (
  <ApolloProvider client={client}>
    <h1>My Lego Sets</h1>
    <div className="flex">
      <SetForm />
      <SetList />
    </div>
  </ApolloProvider>
);

export default App;
```

```css
/* apps/nx-apollo/src/app/app.css */

h1 {
  font-family: sans-serif;
  text-align: center;
}

.flex {
  display: flex;
}

SetList {
  flex: 1;
  padding: 8px;
}
```

If your API isn’t running already, go ahead and start it:

`npm start api`

And now start your React app:

`npm start nx-apollo`

Browse to [http:localhost:4200](http:localhost:4200ß) and see the results of your work!

## Further Reading
NestJS
- [GraphQL Quick Start](https://docs.nestjs.com/graphql/quick-start)

Apollo React
- [Apollo React Client](https://www.apollographql.com/docs/react/)

GraphQL Code Generator
- [Documentation](https://graphql-code-generator.com/)

## Interested in using Angular?
This same example can be implemented in Angular. The repo for that can be found here: [https://github.com/nrwl/nx-apollo-angular-example](https://github.com/nrwl/nx-apollo-angular-example)