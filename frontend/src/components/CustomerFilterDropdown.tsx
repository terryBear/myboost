import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCustomerFilter } from "@/contexts/CustomerFilterContext";

/**
 * Renders a customer filter dropdown that syncs with the URL (customerName).
 * Shown in the header on all report pages so data can be filtered by customer.
 */
export function CustomerFilterDropdown() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, loading } = useCustomerFilter();

  const currentCustomer = searchParams.get("customerName") || "all";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (value === "all") {
      next.delete("customerName");
    } else {
      next.set("customerName", value);
    }
    const query = next.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`, { replace: true });
  };

  if (loading) {
    return (
      <span className="text-sm text-muted-foreground px-2 py-1.5">Loading…</span>
    );
  }

  if (customers.length === 0) {
    return null;
  }

  return (
    <select
      value={currentCustomer}
      onChange={handleChange}
      className="z-50 px-3 py-2 border border-border rounded-md bg-muted text-foreground focus:ring-2 focus:ring-primary focus:border-primary text-sm min-w-[140px] max-w-[200px]"
      title="Filter by customer"
    >
      <option value="all" className="bg-muted text-foreground">
        All Customers
      </option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id} className="bg-muted text-foreground">
          {customer.name}
        </option>
      ))}
    </select>
  );
}
