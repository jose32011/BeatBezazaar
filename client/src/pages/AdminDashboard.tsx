import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Download, Eye, Music } from "lucide-react";
import { Link } from "wouter";
import type { Analytics, Purchase, Beat } from "@shared/schema";

interface PurchaseWithDetails extends Purchase {
  beatTitle?: string;
  username?: string;
}

export default function AdminDashboard() {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['/api/analytics'],
  });

  const { data: purchases } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases'],
  });

  const { data: beats } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });

  // Get beat and user details for purchases
  const [purchasesWithDetails, setPurchasesWithDetails] = useState<PurchaseWithDetails[]>([]);

  useEffect(() => {
    if (purchases && beats) {
      const detailed = purchases.map((purchase) => {
        const beat = Array.isArray(beats) ? beats.find((b: any) => b.id === purchase.beatId) : null;
        return {
          ...purchase,
          beatTitle: beat?.title || 'Unknown',
        };
      });
      setPurchasesWithDetails(detailed);
    }
  }, [purchases, beats]);

  const totalRevenue = purchases?.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your beat marketplace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Visits</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-site-visits">
                {analytics?.siteVisits || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-downloads">
                {analytics?.totalDownloads || 0}
              </div>
              <p className="text-xs text-muted-foreground">Beats downloaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From all sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beats</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-beats">
                {Array.isArray(beats) ? beats.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Purchases</CardTitle>
                <CardDescription>Latest customer purchases</CardDescription>
              </div>
              <Link href="/admin/upload">
                <Button data-testid="button-upload-beat">Upload New Beat</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beat Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesWithDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No purchases yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchasesWithDetails.slice(0, 10).map((purchase) => (
                      <TableRow key={purchase.id} data-testid={`row-purchase-${purchase.id}`}>
                        <TableCell className="font-medium" data-testid={`text-beat-${purchase.id}`}>
                          {purchase.beatTitle}
                        </TableCell>
                        <TableCell data-testid={`text-user-${purchase.id}`}>
                          User #{purchase.userId.slice(0, 8)}
                        </TableCell>
                        <TableCell data-testid={`text-price-${purchase.id}`}>
                          ${parseFloat(purchase.price).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`text-date-${purchase.id}`}>
                          {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : 'N/A'}
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
    </div>
  );
}
