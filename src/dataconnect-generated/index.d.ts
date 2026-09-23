import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Asset_Key {
  id: UUIDString;
  __typename?: 'Asset_Key';
}

export interface CreateAllDemoDataData {
  user_insert: User_Key;
  op: OffboardingProcess_Key;
  asset_insert: Asset_Key;
  task_insert: Task_Key;
  kt: KnowledgeTransfer_Key;
}

export interface DeleteKnowledgeTransferData {
  knowledgeTransfer_delete?: KnowledgeTransfer_Key | null;
}

export interface DeleteKnowledgeTransferVariables {
  id: UUIDString;
}

export interface GetUserData {
  user?: {
    name: string;
    email: string;
  };
}

export interface KnowledgeTransfer_Key {
  id: UUIDString;
  __typename?: 'KnowledgeTransfer_Key';
}

export interface ListMyOffboardingTasksData {
  offboardingProcesses: ({
    status: string;
    tasks_on_offboardingProcess: ({
      title: string;
      dueDate: DateString;
    })[];
  })[];
}

export interface OffboardingProcess_Key {
  id: UUIDString;
  __typename?: 'OffboardingProcess_Key';
}

export interface PublicAssetCatalogData {
  assets: ({
    name: string;
    type: string;
  })[];
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateAllDemoDataRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateAllDemoDataData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateAllDemoDataData, undefined>;
  operationName: string;
}
export const createAllDemoDataRef: CreateAllDemoDataRef;

export function createAllDemoData(): MutationPromise<CreateAllDemoDataData, undefined>;
export function createAllDemoData(dc: DataConnect): MutationPromise<CreateAllDemoDataData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(): MutationPromise<UpdateUserData, undefined>;
export function updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface DeleteKnowledgeTransferRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteKnowledgeTransferVariables): MutationRef<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteKnowledgeTransferVariables): MutationRef<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
  operationName: string;
}
export const deleteKnowledgeTransferRef: DeleteKnowledgeTransferRef;

export function deleteKnowledgeTransfer(vars: DeleteKnowledgeTransferVariables): MutationPromise<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
export function deleteKnowledgeTransfer(dc: DataConnect, vars: DeleteKnowledgeTransferVariables): MutationPromise<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface ListMyOffboardingTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyOffboardingTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyOffboardingTasksData, undefined>;
  operationName: string;
}
export const listMyOffboardingTasksRef: ListMyOffboardingTasksRef;

export function listMyOffboardingTasks(options?: ExecuteQueryOptions): QueryPromise<ListMyOffboardingTasksData, undefined>;
export function listMyOffboardingTasks(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyOffboardingTasksData, undefined>;

interface PublicAssetCatalogRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<PublicAssetCatalogData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<PublicAssetCatalogData, undefined>;
  operationName: string;
}
export const publicAssetCatalogRef: PublicAssetCatalogRef;

export function publicAssetCatalog(options?: ExecuteQueryOptions): QueryPromise<PublicAssetCatalogData, undefined>;
export function publicAssetCatalog(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<PublicAssetCatalogData, undefined>;

