
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Clock, CreditCard, Building2, Eye, Search, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentWithDetails {
  payment: {
    id: string;
    amount: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe';
    bankReference?: string;
    createdAt: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  beat: {
    id: string;
    title: string;
  } | null;
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
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payments');
      return res.json();
    }
  });

  const { data: pendingPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/pending'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payments/status/pending');
      return res.json();
    }
  });

  const { data: approvedPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/approved'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payments/status/approved');
      return res.json();
    }
  });

  const { data: rejectedPayments = [] } = useQuery<PaymentWithDetails[]>({
    queryKey: ['/api/payments/status/rejected'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payments/status/rejected');
      return res.json();
    }
  });

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let sourcePayments: PaymentWithDetails[];
    switch (selectedStatus) {
      case 'pending':
        sourcePayments = pendingPayments;
        break;
      case 'approved':
        sourcePayments = approvedPayments;
        break;
      case 'rejected':
        sourcePayments = rejectedPayments;
        break;
      default:
        sourcePayments = allPayments;
    }

    let filtered = sourcePayments.filter(payment => payment && payment.payment); // Only include payments with valid payment data

    // Filter by search term
    if (searchTerm && selectedStatus === 'all') {
      filtered = filtered.filter(payment => 
        payment.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.beat?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment?.bankReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a.payment;
      const bVal = b.payment;
      if (!aVal || !bVal) return 0;

      let compareA: any, compareB: any;
      switch (sortBy) {
        case 'amount':
          compareA = parseFloat(aVal.amount);
          compareB = parseFloat(bVal.amount);
          break;
        case 'customer':
          compareA = `${a.customer?.firstName} ${a.customer?.lastName}`;
          compareB = `${b.customer?.firstName} ${b.customer?.lastName}`;
          break;
        case 'status':
          compareA = aVal.status;
          compareB = bVal.status;
          break;
        case 'date':
        default:
          compareA = new Date(aVal.createdAt).getTime();
          compareB = new Date(bVal.createdAt).getTime();
          break;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allPayments, pendingPayments, approvedPayments, rejectedPayments, searchTerm, sortBy, sortOrder, selectedStatus]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] }); // User's purchased beats
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] }); // Purchase history
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
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] }); // User's purchased beats
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] }); // Purchase history
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
      case 'stripe':
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Beat</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">Loading payments...</TableCell>
            </TableRow>
          ) : payments.length > 0 ? (
            payments.map(({ payment, customer, beat }) => payment && (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-medium">{customer?.firstName || 'N/A'} {customer?.lastName}</div>
                  <div className="text-sm text-muted-foreground">{customer?.email}</div>
                </TableCell>
                <TableCell>{beat?.title || 'N/A'}</TableCell>
                <TableCell className="text-right">${parseFloat(payment.amount || '0').toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                    <span>{payment.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {payment.status === 'pending' && (
                      <>
                        <Button variant="outline" size="icon" onClick={() => approvePaymentMutation.mutate(payment.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => rejectPaymentMutation.mutate(payment.id)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">No payments found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {showControls && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>
          View, approve, and reject customer payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={selectedStatus}
          className="space-y-4"
          onValueChange={(value) => {
            setSelectedStatus(value);
            setCurrentPage(1);
          }}
        >
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 w-full">
                  <Menu className="h-4 w-4" />
                  <span>
                    {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('approved')}>Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('rejected')}>Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <TabsList className="hidden md:grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All <Badge className="ml-2">{filteredPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending <Badge className="ml-2">{pendingPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved <Badge className="ml-2">{approvedPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected <Badge className="ml-2">{rejectedPayments.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {renderPaymentTable(paginatedPayments, true)}
          </TabsContent>
          <TabsContent value="pending">
            {renderPaymentTable(pendingPayments)}
          </TabsContent>
          <TabsContent value="approved">
            {renderPaymentTable(approvedPayments)}
          </TabsContent>
          <TabsContent value="rejected">
            {renderPaymentTable(rejectedPayments)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
