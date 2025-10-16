import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Music, ShoppingBag } from "lucide-react";
import type { Purchase, Beat } from "@shared/schema";

interface PurchaseWithBeat extends Purchase {
  beat?: Beat;
}

// Mock user ID - in real app this would come from auth
const MOCK_USER_ID = "user-123";

export default function ClientDashboard() {
  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases/user', MOCK_USER_ID],
  });

  const { data: allBeats } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });

  const [purchasesWithBeats, setPurchasesWithBeats] = useState<PurchaseWithBeat[]>([]);

  useEffect(() => {
    if (purchases && allBeats) {
      const detailed = purchases.map((purchase) => {
        const beat = allBeats.find((b) => b.id === purchase.beatId);
        return {
          ...purchase,
          beat,
        };
      });
      setPurchasesWithBeats(detailed);
    }
  }, [purchases, allBeats]);

  const totalSpent = purchases?.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-dashboard-title">
            My Dashboard
          </h1>
          <p className="text-muted-foreground">View your purchased beats and download history</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-purchases">
                {purchases?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Beats owned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-spent">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-available-downloads">
                {purchases?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Purchased Beats</CardTitle>
            <CardDescription>Download your beats anytime</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beat</TableHead>
                  <TableHead>Producer</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>BPM</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date Purchased</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasesWithBeats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No purchases yet. Browse our catalog to find beats!
                    </TableCell>
                  </TableRow>
                ) : (
                  purchasesWithBeats.map((purchase) => (
                    <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                      <TableCell className="font-medium" data-testid={`text-title-${purchase.id}`}>
                        <div className="flex items-center gap-3">
                          {purchase.beat?.imageUrl && (
                            <img
                              src={purchase.beat.imageUrl}
                              alt={purchase.beat.title}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          {purchase.beat?.title || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-producer-${purchase.id}`}>
                        {purchase.beat?.producer || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-genre-${purchase.id}`}>
                        {purchase.beat?.genre || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-bpm-${purchase.id}`}>
                        {purchase.beat?.bpm || 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-price-${purchase.id}`}>
                        ${parseFloat(purchase.price).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-date-${purchase.id}`}>
                        {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          data-testid={`button-download-${purchase.id}`}
                          onClick={() => {
                            console.log('Download beat:', purchase.beat?.title);
                            alert('Download functionality will be implemented in full version!');
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
