import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, AlertCircle, Music, User, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PendingPurchase {
  purchase: {
    id: string;
    beatId: string;
    beatTitle: string;
    beatProducer: string;
    price: number;
    purchasedAt: string;
    status: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
  };
  payment: {
    id: string;
    paymentMethod: string;
    amount: number;
  } | null;
}

export default function ExclusivePurchaseManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPurchase, setSelectedPurchase] = useState<PendingPurchase | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  // Fetch pending exclusive purchases
  const { data: pendingPurchases = [], isLoading } = useQuery<PendingPurchase[]>({
    queryKey: ['/api/admin/exclusive-purchases/pending'],
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      return apiRequest('POST', `/api/admin/exclusive-purchases/${purchaseId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exclusive-purchases/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/beats/exclusive'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] }); // User's purchased beats
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] }); // Purchase history
      setShowApproveDialog(false);
      setSelectedPurchase(null);
      toast({
        title: "Purchase Approved",
        description: "The exclusive beat has been removed from the system and the customer has been granted access.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve purchase",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ purchaseId, notes }: { purchaseId: string; notes: string }) => {
      return apiRequest('POST', `/api/admin/exclusive-purchases/${purchaseId}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exclusive-purchases/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/beats/exclusive'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playlist'] }); // User's purchased beats
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] }); // Purchase history
      setShowRejectDialog(false);
      setSelectedPurchase(null);
      setRejectNotes("");
      toast({
        title: "Purchase Rejected",
        description: "The beat is now visible again and the purchase has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject purchase",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (purchase: PendingPurchase) => {
    setSelectedPurchase(purchase);
    setShowApproveDialog(true);
  };

  const handleReject = (purchase: PendingPurchase) => {
    setSelectedPurchase(purchase);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (selectedPurchase) {
      approveMutation.mutate(selectedPurchase.purchase.id);
    }
  };

  const confirmReject = () => {
    if (selectedPurchase) {
      rejectMutation.mutate({
        purchaseId: selectedPurchase.purchase.id,
        notes: rejectNotes,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Exclusive Purchases
        </CardTitle>
        <CardDescription>
          Review and approve exclusive beat purchases. Once approved, the beat will be removed from the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending purchases...</p>
          </div>
        ) : pendingPurchases.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending exclusive purchases</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beat</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Purchased</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPurchases.map((item) => (
                  <TableRow key={item.purchase.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.purchase.beatTitle}</div>
                          <div className="text-sm text-muted-foreground">{item.purchase.beatProducer}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.user.username}</div>
                          <div className="text-sm text-muted-foreground">{item.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(item.purchase.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.payment ? (
                        <Badge variant="outline">{item.payment.paymentMethod}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.purchase.purchasedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(item)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approve Exclusive Purchase
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this exclusive purchase?
              </DialogDescription>
            </DialogHeader>
            
            {selectedPurchase && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beat:</span>
                    <span className="font-medium">{selectedPurchase.purchase.beatTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Producer:</span>
                    <span className="font-medium">{selectedPurchase.purchase.beatProducer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{selectedPurchase.user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">{formatCurrency(selectedPurchase.purchase.price)}</span>
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Warning: This action cannot be undone!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The beat and its files will be permanently deleted from the system. The purchase record will remain for your records.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowApproveDialog(false)}
                    disabled={approveMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={confirmApprove}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Yes, Approve Purchase
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Reject Exclusive Purchase
              </DialogTitle>
              <DialogDescription>
                Reject this exclusive purchase and make the beat available again.
              </DialogDescription>
            </DialogHeader>
            
            {selectedPurchase && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beat:</span>
                    <span className="font-medium">{selectedPurchase.purchase.beatTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{selectedPurchase.user.username}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reject-notes">Rejection Notes (Optional)</Label>
                  <Textarea
                    id="reject-notes"
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={4}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    The beat will be made visible again and the purchase will be marked as rejected.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectNotes("");
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmReject}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Purchase
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
