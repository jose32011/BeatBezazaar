import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, User, Mail, Phone, MapPin, Calendar, Key, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

interface Purchase {
  id: string;
  userId: string;
  beatId: string;
  price: string;
  purchasedAt: string;
  beat?: {
    id: string;
    title: string;
    producer: string;
    genre: string;
    imageUrl: string;
  };
}

export default function CustomerManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort customers
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder]);

  // Paginate customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const { data: customerPurchases = [], isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ['/api/customers', selectedCustomer?.id, 'purchases'],
    enabled: !!selectedCustomer && showPurchases,
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return apiRequest('PUT', `/api/users/${userId}/password`, { newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "The user's password has been successfully changed.",
      });
      setShowPasswordDialog(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const viewPurchases = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPurchases(true);
  };

  const handlePasswordChange = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = () => {
    if (!selectedCustomer) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      userId: selectedCustomer.userId,
      newPassword: passwordData.newPassword,
    });
  };

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
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>Loading customers...</CardDescription>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Management
          </CardTitle>
          <CardDescription>
            Manage your customers and view their purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2  h-4 w-4" />
                <Input
                  placeholder="Search customers by name, username, email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "email" | "createdAt") => {
                setSortBy(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="createdAt">Date Joined</SelectItem>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "No customers found matching your search" : "No customers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {customer.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        @{customer.username}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.city && customer.state ? (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          {customer.city}, {customer.state}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(customer.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPurchases(customer)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Purchases
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordChange(customer)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredCustomers.length)} of {filteredCustomers.length} customers
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
        </CardContent>
      </Card>

      {/* Customer Purchases Dialog */}
      <Dialog open={showPurchases} onOpenChange={setShowPurchases}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Purchase History - {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogTitle>
            <DialogDescription>
              View all songs purchased by this customer
            </DialogDescription>
          </DialogHeader>
          
          {purchasesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : customerPurchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No purchases found for this customer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerPurchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {purchase.beat && (
                        <>
                          <img
                            src={purchase.beat.imageUrl}
                            alt={purchase.beat.title}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{purchase.beat.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {purchase.beat.producer}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Genre: {purchase.beat.genre}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ${Number(purchase.price).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(purchase.purchasedAt)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Change the password for {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="col-span-3"
                placeholder="Enter new password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-password" className="text-right">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="col-span-3"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

