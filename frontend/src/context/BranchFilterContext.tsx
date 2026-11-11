import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSearchParams } from 'react-router-dom';

interface BranchFilterContextType {
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
  effectiveBranchId?: string; // undefined if 'all'
}

const BranchFilterContext = createContext<BranchFilterContextType | undefined>(undefined);

export const BranchFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // If Branch Admin, locked to user.branchId; If Owner, read from searchParams or state
  const initialBranch =
    user?.role === 'BRANCH_ADMIN' && user.branchId
      ? user.branchId
      : searchParams.get('branchId') || 'all';

  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(initialBranch);

  useEffect(() => {
    if (user?.role === 'BRANCH_ADMIN' && user.branchId) {
      setSelectedBranchIdState(user.branchId);
    } else {
      const paramBranch = searchParams.get('branchId');
      if (paramBranch && paramBranch !== selectedBranchId) {
        setSelectedBranchIdState(paramBranch);
      }
    }
  }, [user, searchParams]);

  const setSelectedBranchId = (branchId: string) => {
    if (user?.role === 'BRANCH_ADMIN' && user.branchId) {
      setSelectedBranchIdState(user.branchId);
      return;
    }
    setSelectedBranchIdState(branchId);
    const newParams = new URLSearchParams(searchParams);
    if (branchId && branchId !== 'all') {
      newParams.set('branchId', branchId);
    } else {
      newParams.delete('branchId');
    }
    setSearchParams(newParams, { replace: true });
  };

  const effectiveBranchId =
    user?.role === 'BRANCH_ADMIN'
      ? user.branchId || undefined
      : selectedBranchId !== 'all'
      ? selectedBranchId
      : undefined;

  return (
    <BranchFilterContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        effectiveBranchId,
      }}
    >
      {children}
    </BranchFilterContext.Provider>
  );
};

export const useBranchFilter = () => {
  const context = useContext(BranchFilterContext);
  if (!context) {
    return {
      selectedBranchId: 'all',
      setSelectedBranchId: () => {},
      effectiveBranchId: undefined,
    };
  }
  return context;
};
