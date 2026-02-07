import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const TermsPage = () => (
  <>
    <Helmet>
      <title>Terms of Service | GoRide</title>
      <meta name="description" content="GoRide Terms of Service and conditions of use." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using GoRide services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">2. Services</h2>
            <p className="text-muted-foreground">
              GoRide provides a ride-sharing platform connecting riders with drivers in Rwanda and other supported regions. We act as an intermediary and do not employ drivers or own vehicles.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You must provide accurate information when creating an account. You are responsible for keeping your credentials secure and for all activity under your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">4. Conduct</h2>
            <p className="text-muted-foreground">
              You agree to use the service lawfully and respectfully. Harassment, fraud, or misuse may result in account suspension or termination.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">5. Payments & Fees</h2>
            <p className="text-muted-foreground">
              Fares are displayed before you confirm a ride. You agree to pay the agreed fare and any applicable taxes. Refund and cancellation policies are as stated in the app.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us via the Help & Support section in the app or at support@goride.rw.
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default TermsPage;
