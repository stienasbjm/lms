import { CreateAllDemoDataData, UpdateUserData, DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables, GetUserData, ListMyOffboardingTasksData, PublicAssetCatalogData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateAllDemoData(options?: useDataConnectMutationOptions<CreateAllDemoDataData, FirebaseError, void>): UseDataConnectMutationResult<CreateAllDemoDataData, undefined>;
export function useCreateAllDemoData(dc: DataConnect, options?: useDataConnectMutationOptions<CreateAllDemoDataData, FirebaseError, void>): UseDataConnectMutationResult<CreateAllDemoDataData, undefined>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;

export function useDeleteKnowledgeTransfer(options?: useDataConnectMutationOptions<DeleteKnowledgeTransferData, FirebaseError, DeleteKnowledgeTransferVariables>): UseDataConnectMutationResult<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;
export function useDeleteKnowledgeTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteKnowledgeTransferData, FirebaseError, DeleteKnowledgeTransferVariables>): UseDataConnectMutationResult<DeleteKnowledgeTransferData, DeleteKnowledgeTransferVariables>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;

export function useListMyOffboardingTasks(options?: useDataConnectQueryOptions<ListMyOffboardingTasksData>): UseDataConnectQueryResult<ListMyOffboardingTasksData, undefined>;
export function useListMyOffboardingTasks(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyOffboardingTasksData>): UseDataConnectQueryResult<ListMyOffboardingTasksData, undefined>;

export function usePublicAssetCatalog(options?: useDataConnectQueryOptions<PublicAssetCatalogData>): UseDataConnectQueryResult<PublicAssetCatalogData, undefined>;
export function usePublicAssetCatalog(dc: DataConnect, options?: useDataConnectQueryOptions<PublicAssetCatalogData>): UseDataConnectQueryResult<PublicAssetCatalogData, undefined>;
