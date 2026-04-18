"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/platform/api/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/core/auth/AuthContext";
import { CheckCircle2, MapPin, Plus, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Fetch cart
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart"),
    enabled: !!user,
  });

  // Fetch addresses
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get("/addresses"),
    enabled: !!user,
  });

  // Automatically select default address
  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddressId) {
      const def = addresses.find((a: any) => a.isDefault);
      setSelectedAddressId(def ? def.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const addAddressMutation = useMutation({
    mutationFn: (data: any) => api.post("/addresses", { ...data, isDefault: true }),
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (addressId: string) =>
      api.post("/orders", {
        billingAddressId: addressId,
        shippingAddressId: addressId,
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Proceed to COD payment
      api.post("/payments", { orderId: order.id, provider: "COD" }).then(() => {
        router.push(`/orders/${order.id}`);
      });
    },
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAddressMutation.mutate(addressForm);
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) return;
    placeOrderMutation.mutate(selectedAddressId);
  };

  if (authLoading || !cart) return null;

  return (
    <div className="pt-8 pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-10">Checkout</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7 space-y-8">
          {/* Addresses */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold flex items-center mb-6">
              <MapPin className="mr-2 h-6 w-6 text-indigo-600" /> Shipping Address
            </h2>

            {loadingAddresses ? (
              <div className="animate-pulse h-20 bg-gray-100 rounded-xl w-full"></div>
            ) : addresses?.length === 0 || showAddressForm ? (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Full Name"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  />
                  <input
                    placeholder="Phone"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
                <input
                  placeholder="Address Line 1"
                  required
                  className="border border-gray-300 p-2 rounded-md w-full"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    placeholder="City"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                  <input
                    placeholder="State"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                  <input
                    placeholder="PIN Code"
                    required
                    className="border border-gray-300 p-2 rounded-md w-full"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  {addresses?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={addAddressMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {addresses.map((address: any) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                      selectedAddressId === address.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{address.fullName} • {address.phone}</p>
                        <p className="text-gray-600 text-sm mt-1">{address.line1}</p>
                        <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.pincode}</p>
                      </div>
                      {selectedAddressId === address.id && (
                        <CheckCircle2 className="text-indigo-600 h-6 w-6" />
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add new address
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Payment</h2>
            <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-xl mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" defaultChecked className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                <span className="font-medium text-indigo-900">Cash on Delivery (COD)</span>
              </label>
            </div>

            <dl className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Subtotal ({cart.items.length} items)</dt>
                <dd className="font-medium text-gray-900">₹{cart.subtotal}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <dt>Tax (GST)</dt>
                <dd className="font-medium text-gray-900">₹{cart.taxAmount}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
                <dt>Total to Pay</dt>
                <dd>₹{cart.grandTotal}</dd>
              </div>
            </dl>

            <button
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || !selectedAddressId}
              className="mt-8 w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {placeOrderMutation.isPending ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                "Place Order & Pay with COD"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
