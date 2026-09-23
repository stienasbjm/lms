# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUser*](#getuser)
  - [*ListMyOffboardingTasks*](#listmyoffboardingtasks)
  - [*PublicAssetCatalog*](#publicassetcatalog)
- [**Mutations**](#mutations)
  - [*CreateAllDemoData*](#createalldemodata)
  - [*UpdateUser*](#updateuser)
  - [*DeleteKnowledgeTransfer*](#deleteknowledgetransfer)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUser
You can execute the `GetUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRef:
```typescript
const name = getUserRef.operationName;
console.log(name);
```

### Variables
The `GetUser` query has no variables.
### Return Type
Recall that executing the `GetUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserData {
  user?: {
    name: string;
    email: string;
  };
}
```
### Using `GetUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUser } from '@dataconnect/generated';


// Call the `getUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRef } from '@dataconnect/generated';


// Call the `getUserRef()` function to get a reference to the query.
const ref = getUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListMyOffboardingTasks
You can execute the `ListMyOffboardingTasks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyOffboardingTasks(options?: ExecuteQueryOptions): QueryPromise<ListMyOffboardingTasksData, undefined>;

interface ListMyOffboardingTasksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyOffboardingTasksData, undefined>;
}
export const listMyOffboardingTasksRef: ListMyOffboardingTasksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyOffboardingTasks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyOffboardingTasksData, undefined>;

interface ListMyOffboardingTasksRef {
  ...
  (dc: DataConnect): QueryRef<ListMyOffboardingTasksData, undefined>;
}
export const listMyOffboardingTasksRef: ListMyOffboardingTasksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyOffboardingTasksRef:
```typescript
const name = listMyOffboardingTasksRef.operationName;
console.log(name);
```

### Variables
The `ListMyOffboardingTasks` query has no variables.
### Return Type
Recall that executing the `ListMyOffboardingTasks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyOffboardingTasksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyOffboardingTasksData {
  offboardingProcesses: ({
    status: string;
    tasks_on_offboardingProcess: ({
      title: string;
      dueDate: DateString;
    })[];
  })[];
}
```
### Using `ListMyOffboardingTasks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyOffboardingTasks } from '@dataconnect/generated';


// Call the `listMyOffboardingTasks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyOffboardingTasks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyOffboardingTasks(dataConnect);

console.log(data.offboardingProcesses);

// Or, you can use the `Promise` API.
listMyOffboardingTasks().then((response) => {
  const data = response.data;
  console.log(data.offboardingProcesses);
});
```

### Using `ListMyOffboardingTasks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyOffboardingTasksRef } from '@dataconnect/generated';


// Call the `listMyOffboardingTasksRef()` function to get a reference to the query.
const ref = listMyOffboardingTasksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyOffboardingTasksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.offboardingProcesses);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.offboardingProcesses);
});
```

## PublicAssetCatalog
You can execute the `PublicAssetCatalog` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
publicAssetCatalog(options?: ExecuteQueryOptions): QueryPromise<PublicAssetCatalogData, undefined>;

interface PublicAssetCatalogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PublicAssetCatalogData, undefined>;
}
export const publicAssetCatalogRef: PublicAssetCatalogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
publicAssetCatalog(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PublicAssetCatalogData, undefined>;

interface PublicAssetCatalogRef {
  ...
  (dc: DataConnect): QueryRef<PublicAssetCatalogData, undefined>;
}
export const publicAssetCatalogRef: PublicAssetCatalogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the publicAssetCatalogRef:
```typescript
const name = publicAssetCatalogRef.operationName;
console.log(name);
```

### Variables
The `PublicAssetCatalog` query has no variables.
### Return Type
Recall that executing the `PublicAssetCatalog` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PublicAssetCatalogData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PublicAssetCatalogData {
  assets: ({
    name: string;
    type: string;
  })[];
}
```
### Using `PublicAssetCatalog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, publicAssetCatalog } from '@dataconnect/generated';


// Call the `publicAssetCatalog()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await publicAssetCatalog();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await publicAssetCatalog(dataConnect);

console.log(data.assets);

// Or, you can use the `Promise` API.
publicAssetCatalog().then((response) => {
  const data = response.data;
  console.log(data.assets);
});
```

### Using `PublicAssetCatalog`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, publicAssetCatalogRef } from '@dataconnect/generated';


// Call the `publicAssetCatalogRef()` function to get a reference to the query.
const ref = publicAssetCatalogRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = publicAssetCatalogRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.assets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.assets);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateAllDemoData
You can execute the `CreateAllDemoData` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createAllDemoData(): MutationPromise<CreateAllDemoDataData, undefined>;

interface CreateAllDemoDataRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateAllDemoDataData, undefined>;
}
export const createAllDemoDataRef: CreateAllDemoDataRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createAllDemoData(dc: DataConnect): MutationPromise<CreateAllDemoDataData, undefined>;

interface CreateAllDemoDataRef {
  ...
  (dc: DataConnect): MutationRef<CreateAllDemoDataData, undefined>;
}
export const createAllDemoDataRef: CreateAllDemoDataRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAllDemoDataRef:
```typescript
const name = createAllDemoDataRef.operationName;
console.log(name);
```

### Variables
The `CreateAllDemoData` mutation has no variables.
### Return Type
Recall that executing the `CreateAllDemoData` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAllDemoDataData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAllDemoDataData {
  user_insert: User_Key;
  op: OffboardingProcess_Key;
  asset_insert: Asset_Key;
  task_insert: Task_Key;
  kt: KnowledgeTransfer_Key;
}
```
### Using `CreateAllDemoData`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createAllDemoData } from '@dataconnect/generated';


// Call the `createAllDemoData()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createAllDemoData();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createAllDemoData(dataConnect);

console.log(data.user_insert);
console.log(data.op);
console.log(data.asset_insert);
console.log(data.task_insert);
console.log(data.kt);

// Or, you can use the `Promise` API.
createAllDemoData().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
  console.log(data.op);
  console.log(data.asset_insert);
  console.log(data.task_insert);
  console.log(data.kt);
});
```

### Using `CreateAllDemoData`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAllDemoDataRef } from '@dataconnect/generated';


// Call the `createAllDemoDataRef()` function to get a reference to the mutation.
const ref = createAllDemoDataRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAllDemoDataRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);
console.log(data.op);
console.log(data.asset_insert);
console.log(data.task_insert);
console.log(data.kt);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
  console.log(data.op);
  console.log(data.asset_insert);
  console.log(data.task_insert);
  console.log(data.kt);
});
```

## UpdateUser
You can execute the `UpdateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUser(): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserRef:
```typescript
const name = updateUserRef.operationName;
console.log(name);
```

### Variables
The `UpdateUser` mutation has no variables.
### Return Type
Recall that executing the `UpdateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUser } from '@dataconnect/generated';


// Call the `updateUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUser(dataConnect);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUser().then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserRef } from '@dataconnect/generated';


// Call the `updateUserRef()` function to get a reference to the mutation.
const ref = updateUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## DeleteKnowledgeTransfer
You can execute the `DeleteKnowledgeTransfer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteKnowledgeTransfer(vars: DeleteKnowledgeTransferVariables): MutationPromise<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;

interface DeleteKnowledgeTransferRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteKnowledgeTransferVariables): MutationRef<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
}
export const deleteKnowledgeTransferRef: DeleteKnowledgeTransferRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteKnowledgeTransfer(dc: DataConnect, vars: DeleteKnowledgeTransferVariables): MutationPromise<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;

interface DeleteKnowledgeTransferRef {
  ...
  (dc: DataConnect, vars: DeleteKnowledgeTransferVariables): MutationRef<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
}
export const deleteKnowledgeTransferRef: DeleteKnowledgeTransferRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteKnowledgeTransferRef:
```typescript
const name = deleteKnowledgeTransferRef.operationName;
console.log(name);
```

### Variables
The `DeleteKnowledgeTransfer` mutation requires an argument of type `DeleteKnowledgeTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteKnowledgeTransferVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteKnowledgeTransfer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteKnowledgeTransferData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteKnowledgeTransferData {
  knowledgeTransfer_delete?: KnowledgeTransfer_Key | null;
}
```
### Using `DeleteKnowledgeTransfer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteKnowledgeTransfer, DeleteKnowledgeTransferVariables } from '@dataconnect/generated';

// The `DeleteKnowledgeTransfer` mutation requires an argument of type `DeleteKnowledgeTransferVariables`:
const deleteKnowledgeTransferVars: DeleteKnowledgeTransferVariables = {
  id: ..., 
};

// Call the `deleteKnowledgeTransfer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteKnowledgeTransfer(deleteKnowledgeTransferVars);
// Variables can be defined inline as well.
const { data } = await deleteKnowledgeTransfer({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteKnowledgeTransfer(dataConnect, deleteKnowledgeTransferVars);

console.log(data.knowledgeTransfer_delete);

// Or, you can use the `Promise` API.
deleteKnowledgeTransfer(deleteKnowledgeTransferVars).then((response) => {
  const data = response.data;
  console.log(data.knowledgeTransfer_delete);
});
```

### Using `DeleteKnowledgeTransfer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteKnowledgeTransferRef, DeleteKnowledgeTransferVariables } from '@dataconnect/generated';

// The `DeleteKnowledgeTransfer` mutation requires an argument of type `DeleteKnowledgeTransferVariables`:
const deleteKnowledgeTransferVars: DeleteKnowledgeTransferVariables = {
  id: ..., 
};

// Call the `deleteKnowledgeTransferRef()` function to get a reference to the mutation.
const ref = deleteKnowledgeTransferRef(deleteKnowledgeTransferVars);
// Variables can be defined inline as well.
const ref = deleteKnowledgeTransferRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteKnowledgeTransferRef(dataConnect, deleteKnowledgeTransferVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.knowledgeTransfer_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.knowledgeTransfer_delete);
});
```

