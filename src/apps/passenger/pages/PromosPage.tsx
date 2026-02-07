import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const PromosPage = () => (
  <>
    <Helmet>
      <title>Promos | GoRide</title>
    </Helmet>
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/ride">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Promos & offers</CardTitle>
          <CardDescription>Your active and past promo codes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mb-4 opacity-50" />
            <p>No active promos. Check back later for offers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default PromosPage;
