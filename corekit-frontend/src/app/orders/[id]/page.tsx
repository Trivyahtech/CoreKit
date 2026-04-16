"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle2, Package, Loader2 } from "lucide-react";
import Link from "next/link";

export default function OrderDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="pt-8 pb-16">
      <Link href="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Order {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Placed on <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time>
          </p>
        </div>
        <div>
          <span className={`px-4 py-2 inline-flex text-sm leading-5 font-bold rounded-full ${
            order.status === "CONFIRMED" || order.status === "COMPLETED"
              ? "bg-green-100 text-green-800"
              : order.status === "CANCELLED"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Items */}
          <div className="bg-white shadow-sm sm:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Items Ordered</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {order.items.map((item: any) => (
                <li key={item.id} className="p-4 sm:p-6 flex">
                  <div className="flex-shrink-0 bg-gray-100 rounded-lg w-20 h-20 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400 opacity-50" />
                  </div>
                  <div className="ml-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.productName}</h4>
                        <p className="mt-1 text-sm text-gray-500">Variant: {item.variantName}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">₹{item.totalAmount}</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Tracking Logs */}
          <div className="bg-white shadow-sm sm:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Order Updates</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {order.statusLogs.map((log: any, idx: number) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {idx !== order.statusLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                              <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Changed to <span className="font-medium text-gray-900">{log.toStatus}</span>
                              </p>
                              {log.note && <p className="mt-1 text-sm text-gray-600">{log.note}</p>}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-gray-50 shadow-sm sm:rounded-2xl border border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Payment Summary</h3>
            <dl className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Payment Method</dt>
                <dd className="font-medium text-gray-900">
                  {order.payments?.[0]?.method || 'Pending'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Payment Status</dt>
                <dd className="font-medium text-gray-900">
                  {order.paymentStatus}
                </dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-gray-900">₹{order.subtotal}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd className="font-medium text-gray-900">₹{order.taxAmount}</dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-bold text-gray-900">
                <dt>Grand Total</dt>
                <dd>₹{order.grandTotal}</dd>
              </div>
            </dl>
          </div>

          {/* Addresses */}
           <div className="bg-white shadow-sm sm:rounded-2xl border border-gray-200 px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Shipping Address</h3>
            <address className="not-italic text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
