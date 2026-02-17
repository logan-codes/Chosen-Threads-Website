"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Star, 
  DollarSign,
  Eye,
  Clock,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/admin/AdminLayout";
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  customizable: boolean;
  rating: number;
  tag?: string | null;
}

interface Order {
  id: number;
  user_id: string;
  product_id: number;
  status: 'pending_confirmation' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  total_price: number;
  created_at: string;
}

interface Review {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalReviews: 0,
    pendingOrders: 0,
    inProductionOrders: 0,
    averageRating: 0,
    recentOrders: [] as Order[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from("Products").select("*"),
        supabase.from("Order").select("*").order("created_at", { ascending: false }),
        supabase.from("Reviews").select("*").order("created_at", { ascending: false })
      ]);

      if (productsRes.data) {
        const productsData = productsRes.data as Product[];
        setProducts(productsData);
        
        // Calculate stats
        const ordersData = ordersRes.data || [];
        const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + (order.total_price || 0), 0);
        const totalOrders = ordersData.length;
        const totalReviews = reviewsRes.data?.length || 0;
        const pendingOrders = ordersData.filter((order: Order) => order.status === 'pending_confirmation').length;
        const inProductionOrders = ordersData.filter((order: Order) => order.status === 'in_production').length;
        const averageRating = reviewsRes.data?.reduce((sum: number, review: Review) => sum + review.rating, 0) / totalReviews || 0;
        
        setStats({
          totalRevenue,
          totalOrders,
          totalProducts: productsData.length,
          totalReviews,
          pendingOrders,
          inProductionOrders,
          averageRating,
          recentOrders: ordersData.slice(0, 5)
        });
      }
      
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_confirmation': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-indigo-100 text-indigo-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Live data
                </span>
              </p>
              <div className="mt-2">
                <Progress value={75} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">All time orders</span>
              </p>
              <div className="mt-2">
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">Active catalog</span>
              </p>
              <div className="mt-2">
                <Progress value={40} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {stats.totalReviews} reviews
              </p>
              <div className="mt-2">
                <Progress value={(stats.averageRating / 5) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>Orders awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                  <p className="text-sm text-gray-600">Orders pending</p>
                </div>
                <Button onClick={() => router.push("/admin/orders")}>
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In Production</CardTitle>
              <CardDescription>Orders being processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{stats.inProductionOrders}</p>
                  <p className="text-sm text-gray-600">Active production</p>
                </div>
                <Button onClick={() => router.push("/admin/orders")}>
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/admin/products")}>
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/admin/orders")}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                View Orders
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/admin/reviews")}>
                <Star className="w-4 h-4 mr-2" />
                Manage Reviews
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No orders yet</p>
              ) : (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                      <span className="text-sm font-medium">₹{order.total_price?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
