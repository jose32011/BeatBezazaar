import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, CreditCard, Building2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface PaymentWithDetails {
  payment: {
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    bankReference?: string;
    notes?: string;
    createdAt: string;
    approvedAt?: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  purchase: {
    id: string;
    price: string;
    purchasedAt: string;
  };
  beat: {
    id: string;
    title: string;
    producer: string;
    genre: string;
    imageUrl: string;
  };
  user: {
    id: string;
    username: string;
  };
}

export default function PaymentManagement() {
  const queryClient = useQueryClient();

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"amount" | "date" | "customer" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: allPayments = [], isLoading } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments'],
  });

  const { data: pendingPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/pending'],
  });

  const { data: approvedPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/approved'],
  });

  const { data: rejectedPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/rejected'],
  });

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let filtered = allPayments.filter(payment => payment && payment.payment); // Only include payments with valid payment data

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.beat?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.bankReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(payment => payment.payment?.status === selectedStatus);
    }

    // Sort payments
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'amount':
          aValue = parseFloat(a.payment?.amount || '0');
          bValue = parseFloat(b.payment?.amount || '0');
          break;
        case 'date':
          aValue = a.payment?.createdAt || new Date().toISOString();
          bValue = b.payment?.createdAt || new Date().toISOString();
          break;
        case 'customer':
          aValue = `${a.customer?.firstName || 'Unknown'} ${a.customer?.lastName || 'Customer'}`.toLowerCase();
          bValue = `${b.customer?.firstName || 'Unknown'} ${b.customer?.lastName || 'Customer'}`.toLowerCase();
          break;
        case 'status':
          aValue = (a.payment?.status || 'unknown').toLowerCase();
          bValue = (b.payment?.status || 'unknown').toLowerCase();
          break;
        default:
          aValue = a.payment?.createdAt || new Date().toISOString();
          bValue = b.payment?.createdAt || new Date().toISOString();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allPayments, searchTerm, selectedStatus, sortBy, sortOrder]);

  // Paginate payments
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);

  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      console.log("Attempting to approve payment with ID:", paymentId);
      // Get the current admin user ID from the session
      const adminResponse = await apiRequest('GET', '/api/auth/me');
      const adminUser = await adminResponse.json();
      console.log("Current admin user:", adminUser);
      
      const response = await apiRequest('POST', `/api/payments/${paymentId}/approve`, {
        approvedBy: adminUser.user?.id || 'admin' // Use actual admin user ID
      });
      console.log("Payment approval response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Payment approved successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/status/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/status/approved'] });
      toast({
        title: "Payment Approved",
        description: "The payment has been approved successfully.",
      });
    },
    onError: (error) => {
      console.error("Payment approval error:", error);
      toast({
        title: "Error",
        description: "Failed to approve payment.",
        variant: "destructive",
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Get the current admin user ID from the session
      const adminResponse = await apiRequest('GET', '/api/auth/me');
      const adminUser = await adminResponse.json();
      
      return apiRequest('POST', `/api/payments/${paymentId}/reject`, {
        approvedBy: adminUser.user?.id || 'admin' // Use actual admin user ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/status/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/status/rejected'] });
      toast({
        title: "Payment Rejected",
        description: "The payment has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject payment.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-red-800 border-red-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-700"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'paypal':
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const renderPaymentTable = (payments: PaymentWithDetails[], showControls: boolean = false) => (
    <div className="space-y-4">
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: "amount" | "date" | "customer" | "status") => {
              setSortBy(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => {
              setSortOrder(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Asc</SelectItem>
                <SelectItem value="desc">Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Beat</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {searchTerm || selectedStatus !== "all" ? "No payments found matching your criteria" : "No payments found"}
              </TableCell>
            </TableRow>
          ) : (
            payments.filter(paymentData => paymentData && paymentData.payment).map((paymentData, index) => (
            <TableRow key={paymentData.payment?.id || `payment-${index}`}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {paymentData.customer?.firstName || 'Unknown'} {paymentData.customer?.lastName || 'Customer'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {paymentData.customer?.email || 'No email'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={paymentData.beat?.imageUrl || '/placeholder-beat.jpg'}
                    alt={paymentData.beat?.title || 'Unknown Beat'}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium">{paymentData.beat?.title || 'Unknown Beat'}</div>
                    <div className="text-sm text-muted-foreground">
                      by {paymentData.beat?.producer || 'Unknown Producer'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold">
                  ${Number(paymentData.payment?.amount || 0).toFixed(2)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(paymentData.payment?.paymentMethod || 'unknown')}
                  <span className="capitalize">
                    {(paymentData.payment?.paymentMethod || 'unknown').replace('_', ' ')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(paymentData.payment?.status || 'unknown')}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDate(paymentData.payment?.createdAt || new Date().toISOString())}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {paymentData.payment?.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approvePaymentMutation.mutate(paymentData.payment?.id || '')}
                        disabled={approvePaymentMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectPaymentMutation.mutate(paymentData.payment?.id || '')}
                        disabled={rejectPaymentMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {paymentData.payment?.bankReference && (
                    <Button
                      size="sm"
                      variant="outline"
                      title={`Bank Reference: ${paymentData.payment.bankReference}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {showControls && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>Loading payments...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>
          Manage payments and approve bank transfers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Payments ({allPayments.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedPayments.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedPayments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderPaymentTable(paginatedPayments, true)}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending payments.</p>
              </div>
            ) : (
              renderPaymentTable(pendingPayments)
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-4">
            {approvedPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No approved payments.</p>
              </div>
            ) : (
              renderPaymentTable(approvedPayments)
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-4">
            {rejectedPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rejected payments.</p>
              </div>
            ) : (
              renderPaymentTable(rejectedPayments)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

