# Nx Apollo React Example

This project was generated using [Nx](https://nx.dev).

<p align="center"><img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" width="450"></p>

🔎 **Nx is a set of Extensible Dev Tools for Monorepos.**

## Run demo
GraphQL API
- `npm start api`

[React](https://reactjs.org)
- `npm start nx-apollo`

## Interested in using Angular?
This same example can be implemented in Angular. The repo for that can be found here: [https://github.com/nrwl/nx-apollo-angular-example](https://github.com/nrwl/nx-apollo-angular-example)

## What you’ll create
In this article, we’ll be creating a simple GraphQL API that will allow us to track some information about Lego sets. We’ll create this API using NestJS, and it will be consumed by a React application. We’ll have this all inside of a Nx Workspace in a single repository.

## What you’ll learn
In this article, you’ll learn how to:
- Create an Nx workspace for both frontend and backend applications
- Create a GraphQL API using NestJS
- Autogenerate frontend code based on your GraphQL schema
- Create a React application to consume your GraphQL api

## Create a new workspace

Let’s get started by creating our Nx workspace. We’ll start with a React workspace that uses the Nx CLI:

`npx create-nx-workspace --preset=react --cli nx`

When prompted, answer the prompts as follows:

```bash
npx create-nx-workspace --preset=react --cli=nx
? Workspace name (e.g., org name)     nx-apollo-react-example
? Application name                    nx-apollo
? Default stylesheet format           CSS
```

## Create GraphQL API
We’ll be using the NestJS framework to create our GraphQL API. First, let’s add NestJS to our Nx workspace and create an application:

`npm install --save-dev @nrwl/nest`

`nx generate @nrwl/nest:application api`

When prompted for a directory, press enter. This will place the api application in the roots of our `apps` directory.

Once our application is created, we’ll install the GraphQL modules needed for Nest

`npm install @nestjs/graphql apollo-server-express graphql-tools graphql`

We’re going to need a GraphQL schema to create our API, so let’s create a very simple one with a single query and a single mutation. Create a file named `schema.graphql` in the api application:

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

Now we can import the GraphQLModule and use that schema in NestJS.

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

This is already enough to see some progress when we run our API application.

`npm start api`

When the application is running, you can bring up the GraphQL playground in your browser at [http://localhost:3333/graphql](http://localhost:3333/graphql)

Here you can inspect your GraphQL schema as well as submit queries. The queries won’t return anything right now because we haven’t provided any data. Let’s take care of that by writing a resolver. Create a new file in your api project called `set.resolver.ts`. Then add this code:

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

This is a very simple resolver which will hold our data in memory. It will return the current contents of the sets array for the allSets query and allow users to add a new set using the addSet mutation. Once we have this written, we need to add it to our providers array in our app module:

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

Now that our API is working, we’re ready to build a frontend to access this.

## Add Apollo to  React App

We’ll be using the Apollo client to consume our GraphQL API, so let’s install that. 

`npm install apollo-boost @apollo/react-hooks graphql`

Modify your app.tsx to provide the Apollo Client:

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
Nx alllows us to break down our code into well-organized libraries for consumption by apps, so let's create a couple of React libraries to organize our work. We'll create a data-access library which will handle communication with the backend, and a feature-sets library which will include our container components for displaying the Lego set data. In a real app, we might also create a ui library which would include our reusable presentational components, but we'll leave that out in this example. For more information on how to organize your React monorepo using Nx, read our book *Effective React Development with Nx* by registering at [Nrwl Connect](https://connect.nrwl.io/).

To create the described libraries, we run these commands:

`nx generate @nrwl/react:library data-access --style css`

`nx generate @nrwl/react:library feature-sets --style css`

## Setup React Code Generation
We’ll take advantage of a tool called GraphQL Code Generator to make things a little easier. As always, first we install dependencies:

`npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo`

We’ll need to create some queries and mutations for the frontend to consume GraphQL. Create a folder inside our data-access library named graphql with a file inside called operations.graphql:

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

To configure the code generator for React, we’ll create a file named codegen.yml in our React project:

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

This configuration will grab the GraphQL schema from the api project and the operations we just created in our React library and generate all of the needed types and hooks to consume the API. 

To actually run this code generator, we’ll add a new task to our React project in our workspace:

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

We should now have a folder called `generated` in our React project with a file named `generated.ts`. It contains typing information about the GraphQL schema and the operations we defined. It even has some hooks which will make consuming this api super-fast.

To make these available to consumers, we'll export them in the index.ts of our data-access library:

```typescript
// libs/data-access/src/index.ts

export * from './lib/data-access';
export * from './lib/generated/generated';
```

## Create React components
We now have all we need to start building our React components. We’ll create two: a list of Lego sets and a form to add a Lego set. We use the Nx CLI to build these:

`nx generate @nrwl/react:component --name=SetList --export --project=feature-sets --style=css`

`nx generate @nrwl/react:component --name=SetForm --export --project=feature-sets --style=css`

In the SetList component, add the following:

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

Notice how we’ve imported useSetListQuery. This is a hook genereated by GraphQL Code Generator that will allow us to use the results of the SetList query we created earlier. This entire pipeline is typesafe, using the types generated for us.

In the SetForm component, add the following:

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

## Integrate components into app

Final step: bring those new components into our app component and add a little styling:

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

Browse to [http:localhost:4200](http:localhost:4200ß) and see the results of our work!

## Further Reading
NestJS
- [GraphQL Quick Start](https://docs.nestjs.com/graphql/quick-start)

Apollo React
- [Apollo React Client](https://www.apollographql.com/docs/react/)

GraphQL Code Generator
- [Documentation](https://graphql-code-generator.com/)
