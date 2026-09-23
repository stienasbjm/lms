# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateAllDemoData, useUpdateUser, useDeleteKnowledgeTransfer, useGetUser, useListMyOffboardingTasks, usePublicAssetCatalog } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateAllDemoData();

const { data, isPending, isSuccess, isError, error } = useUpdateUser();

const { data, isPending, isSuccess, isError, error } = useDeleteKnowledgeTransfer(deleteKnowledgeTransferVars);

const { data, isPending, isSuccess, isError, error } = useGetUser();

const { data, isPending, isSuccess, isError, error } = useListMyOffboardingTasks();

const { data, isPending, isSuccess, isError, error } = usePublicAssetCatalog();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createAllDemoData, updateUser, deleteKnowledgeTransfer, getUser, listMyOffboardingTasks, publicAssetCatalog } from '@dataconnect/generated';


// Operation CreateAllDemoData: 
const { data } = await CreateAllDemoData(dataConnect);

// Operation UpdateUser: 
const { data } = await UpdateUser(dataConnect);

// Operation DeleteKnowledgeTransfer:  For variables, look at type DeleteKnowledgeTransferVars in ../index.d.ts
const { data } = await DeleteKnowledgeTransfer(dataConnect, deleteKnowledgeTransferVars);

// Operation GetUser: 
const { data } = await GetUser(dataConnect);

// Operation ListMyOffboardingTasks: 
const { data } = await ListMyOffboardingTasks(dataConnect);

// Operation PublicAssetCatalog: 
const { data } = await PublicAssetCatalog(dataConnect);


```