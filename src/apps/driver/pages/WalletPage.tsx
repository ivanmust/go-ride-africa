import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet, ArrowUpRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const WalletPage = () => (
  <>
    <Helmet>
      <title>Wallet | GoRide Driver</title>
    </Helmet>
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/drive">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          <CardDescription>Your driver earnings and payouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="text-2xl font-bold text-primary">RWF 0</p>
          </div>
          <Button variant="outline" className="w-full gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Request payout
          </Button>
        </CardContent>
      </Card>
    </div>
  </>
);

export default WalletPage;
