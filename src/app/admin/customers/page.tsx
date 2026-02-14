"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Users, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  Star, 
  MapPin,
  Package,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Eye
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  orders_count: number;
  total_spent: number;
}

interface CustomerOrder {
  id: number;
  created_at: string;
  status: string;
  total_price: number;
  product: {
    name: string;
    image: string;
  }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    avgOrdersPerCustomer: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customers', {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch customers');

      const data = await response.json();
      setCustomers(data.customers);

      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = data.customers.filter((c: Customer) => 
        new Date(c.created_at) >= monthStart
      ).length;

      const totalRevenue = data.customers.reduce((sum: number, c: Customer) => 
        sum + (c.total_spent || 0), 0
      );

      const totalOrders = data.customers.reduce((sum: number, c: Customer) => 
        sum + (c.orders_count || 0), 0
      );

      setStats({
        total: data.total,
        newThisMonth,
        totalRevenue,
        avgOrdersPerCustomer: data.customers.length > 0 ? totalOrders / data.customers.length : 0
      });
    } catch (error) {
      toast.error('Failed to fetch customers');
      console.error(error);
    }
    setLoading(false);
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('Order')
        .select(`
          id,
          created_at,
          status,
          total_price,
          product:product_id (
            name,
            image
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.id);
    setIsDialogOpen(true);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-indigo-100 text-indigo-800';
      case 'pending_confirmation': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage customer accounts and view purchase history</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.newThisMonth} new this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.newThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">
                +{stats.total > 0 ? ((stats.newThisMonth / stats.total) * 100).toFixed(1) : 0}% growth
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Orders/Customer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgOrdersPerCustomer.toFixed(1)}</div>
              <p className="text-xs text-gray-500 mt-1">
                Lifetime average
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">
                From all customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCustomers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">Try adjusting your search</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewCustomer(customer)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {customer.full_name?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {customer.full_name || 'No Name'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Orders</p>
                      <p className="text-lg font-semibold">{customer.orders_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Spent</p>
                      <p className="text-lg font-semibold">${(customer.total_spent || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Joined {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {customer.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Customer Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View customer information and order history
              </DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || selectedCustomer.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCustomer.full_name || 'No Name'}</h3>
                    <p className="text-gray-600">{selectedCustomer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={selectedCustomer.role === 'admin' ? 'default' : 'secondary'}>
                        {selectedCustomer.role}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Member since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.orders_count || 0}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      ${(selectedCustomer.total_spent || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      ${selectedCustomer.orders_count > 0 
                        ? (selectedCustomer.total_spent / selectedCustomer.orders_count).toFixed(2) 
                        : '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order History ({customerOrders.length})
                  </h4>
                  
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg overflow-hidden">
                              {order.product?.[0]?.image ? (
                                <img 
                                  src={order.product[0].image} 
                                  alt={order.product[0].name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-full h-full p-2 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {order.product?.[0]?.name || 'Unknown Product'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Order #{order.id} • {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total_price}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                  <Button asChild>
                    <Link href={`mailto:${selectedCustomer.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email Customer
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
