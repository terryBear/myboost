import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, getShareToken } from "@/services/api";

export interface CustomerFilterCustomer {
  id: string;
  name: string;
  [key: string]: unknown;
}

type CustomerFilterContextValue = {
  customers: CustomerFilterCustomer[];
  loading: boolean;
  refetch: () => Promise<void>;
};

const CustomerFilterContext = createContext<CustomerFilterContextValue | null>(null);

export function CustomerFilterProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<CustomerFilterCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const shareToken = getShareToken();
      const params = shareToken ? { share_token: shareToken } : undefined;
      const data = await get<CustomerFilterCustomer[]>("reporting/dashboard/customers/", {
        params,
      });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("CustomerFilter: failed to fetch customers", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const value: CustomerFilterContextValue = {
    customers,
    loading,
    refetch: fetchCustomers,
  };

  return (
    <CustomerFilterContext.Provider value={value}>
      {children}
    </CustomerFilterContext.Provider>
  );
}

export function useCustomerFilter() {
  const ctx = useContext(CustomerFilterContext);
  return ctx ?? { customers: [], loading: false, refetch: async () => {} };
}
