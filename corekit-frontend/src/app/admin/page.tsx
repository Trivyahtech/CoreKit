import { DollarSign, ShoppingCart, Users, TrendingUp, Package, ArrowDownRight, ArrowUpRight } from "lucide-react";

const stats = [
  {
    name: "Total Revenue",
    value: "₹24,500",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    iconColor: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  {
    name: "Active Orders",
    value: "38",
    change: "+4.2%",
    trend: "up",
    icon: ShoppingCart,
    iconColor: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400",
  },
  {
    name: "Registered Users",
    value: "1,204",
    change: "+8.1%",
    trend: "up",
    icon: Users,
    iconColor: "text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400",
  },
  {
    name: "Products Listed",
    value: "156",
    change: "-2.3%",
    trend: "down",
    icon: Package,
    iconColor: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400",
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "John Doe", amount: "₹2,450", status: "Processing", date: "Today" },
  { id: "ORD-002", customer: "Jane Smith", amount: "₹1,200", status: "Shipped", date: "Today" },
  { id: "ORD-003", customer: "Raj Patel", amount: "₹890", status: "Delivered", date: "Yesterday" },
  { id: "ORD-004", customer: "Priya Sharma", amount: "₹3,100", status: "Processing", date: "Yesterday" },
  { id: "ORD-005", customer: "Amit Kumar", amount: "₹560", status: "Cancelled", date: "2 days ago" },
];

const statusColors: Record<string, string> = {
  Processing: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  Shipped: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  Delivered: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cancelled: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={stat.name}
              className="bg-card-bg border border-card-border rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`flex items-center text-xs font-medium ${
                    stat.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                  }`}
                >
                  <TrendIcon className="h-3.5 w-3.5 mr-0.5" />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-xs text-muted mt-1">{stat.name}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders & Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="xl:col-span-2 bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Orders</h2>
            <span className="text-xs text-muted">Last 7 days</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-card-border/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-accent">{order.id}</td>
                    <td className="px-5 py-3 text-foreground">{order.customer}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{order.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-card-bg border border-card-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Quick Overview</h2>
          <div className="space-y-4">
            {[
              { label: "Pending Shipments", value: "12", color: "bg-amber-500" },
              { label: "Returns Requested", value: "3", color: "bg-red-500" },
              { label: "Low Stock Items", value: "7", color: "bg-orange-500" },
              { label: "Reviews Pending", value: "18", color: "bg-blue-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-card-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted">Revenue is up 12.5% from last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
