import type { PaginatedResponse, PaginationMeta } from '@/types/core';

export interface AccessToken {
  id: string;
  name: string;
  token: string;
  scopes: string;
  owner_type: string;
  owner_id: string;
  owner_name?: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessTokenFormData {
  name: string;
  scopes: string;
  expires_at?: string | null;
}

export type AccessTokensResponse = PaginatedResponse<AccessToken>;

export interface AccessTokensState {
  tokens: AccessToken[];
  selectedTokenIds: string[];
  meta: {
    pagination: PaginationMeta;
  };
  loading: {
    list: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    bulk: boolean;
    regenerateToken: boolean;
  };
  searchQuery: string;
  sortBy: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
}
