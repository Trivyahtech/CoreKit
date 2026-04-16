"use client";

import Link from "next/link";
import { ShoppingCart, User, LogOut, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                CoreKit
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/products"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Products
              </Link>
              <Link
                href="/categories"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Categories
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/cart"
              className="text-gray-400 hover:text-gray-500 flex items-center"
            >
              <ShoppingCart className="h-6 w-6" />
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/orders"
                  className="text-gray-400 hover:text-gray-500"
                  title="My Orders"
                >
                  <Package className="h-5 w-5" />
                </Link>
                <div className="flex items-center text-sm text-gray-700">
                  <User className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="hidden sm:inline-block">{user.firstName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 flex items-center"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 line-clamp-1"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
