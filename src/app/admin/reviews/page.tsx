"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Star, 
  MessageSquare, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Package,
  User,
  Filter,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReviewStatus = 'pending' | 'approved' | 'all';

interface Review {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  approved: boolean;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  product?: {
    name: string;
    image: string;
  };
  user?: {
    email: string;
    full_name: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ReviewStatus>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews?status=${activeTab}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews);
      
      // Calculate stats
      const allReviews = activeTab === 'all' ? data.reviews : [];
      setStats({
        total: data.total,
        pending: allReviews.filter((r: Review) => !r.approved).length,
        approved: allReviews.filter((r: Review) => r.approved).length,
        averageRating: allReviews.length > 0 
          ? allReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / allReviews.length 
          : 0
      });
    } catch (error) {
      toast.error('Failed to fetch reviews');
      console.error(error);
    }
    setLoading(false);
  };

  const updateReviewStatus = async (reviewId: number, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, approved })
      });

      if (!response.ok) throw new Error('Failed to update review');

      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, approved } : r
      ));
      
      toast.success(approved ? 'Review approved' : 'Review rejected');
    } catch (error) {
      toast.error('Failed to update review status');
      console.error(error);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/admin/reviews?reviewId=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete review');

      toast.success("Review deleted successfully");
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      toast.error("Failed to delete review");
      console.error(error);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating && r.approved).length
    }));
    const maxCount = Math.max(...distribution.map(d => d.count), 1);

    return (
      <div className="space-y-2">
        {distribution.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-xs font-medium w-3">{rating}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600">Manage customer reviews and feedback</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {renderRatingDistribution()}
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Search */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReviewStatus)}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2">{stats.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {/* Reviews List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className={cn(
                      "hover:shadow-md transition-shadow",
                      !review.approved && "border-orange-200 bg-orange-50/30"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {renderStars(review.rating)}
                              {!review.approved && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  Pending
                                </Badge>
                              )}
                              {review.verified_purchase && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="font-semibold text-lg mb-1">{review.title}</h3>
                          <p className="text-gray-700 mb-3 line-clamp-2">{review.content}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{review.user?.full_name || review.user?.email || 'Anonymous'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                <span>{review.product?.name || 'Unknown Product'}</span>
                              </div>
                              {review.helpful_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{review.helpful_count} helpful</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!review.approved ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateReviewStatus(review.id, true)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() => updateReviewStatus(review.id, false)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateReviewStatus(review.id, false)}
                                >
                                  Unapprove
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReview(review);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => deleteReview(review.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                Full review content and moderation options
              </DialogDescription>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-gray-500">
                    {new Date(selectedReview.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-lg">{selectedReview.title}</h3>
                
                <Textarea
                  value={selectedReview.content}
                  readOnly
                  rows={6}
                  className="resize-none"
                />

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-500">User</span>
                    <p className="text-gray-900">{selectedReview.user?.full_name || selectedReview.user?.email || 'Anonymous'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Product</span>
                    <p className="text-gray-900">{selectedReview.product?.name || 'Unknown Product'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Status</span>
                    <p className={selectedReview.approved ? "text-green-600" : "text-orange-600"}>
                      {selectedReview.approved ? "Approved" : "Pending Approval"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Helpful Votes</span>
                    <p className="text-gray-900">{selectedReview.helpful_count || 0}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                  {!selectedReview.approved && (
                    <Button onClick={() => {
                      updateReviewStatus(selectedReview.id, true);
                      setIsDialogOpen(false);
                    }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Review
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteReview(selectedReview.id);
                      setIsDialogOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Review
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
