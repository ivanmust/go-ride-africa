import { Button } from "@/components/ui/button";
import { Smartphone, Apple, Play } from "lucide-react";

export const DownloadSection = () => {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent rounded-full blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
              Download the GoRide app
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0">
              Available on iOS and Android. Get your first ride free with code <span className="font-bold">GORIDE2024</span>
            </p>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="secondary"
                size="xl"
                className="group bg-foreground text-background hover:bg-foreground/90"
              >
                <Apple className="w-6 h-6 mr-2" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </Button>
              <Button
                variant="secondary"
                size="xl"
                className="group bg-foreground text-background hover:bg-foreground/90"
              >
                <Play className="w-6 h-6 mr-2" />
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </Button>
            </div>

            {/* QR Code hint */}
            <p className="mt-6 text-sm text-primary-foreground/60">
              Or scan the QR code to download
            </p>
          </div>

          {/* Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-64 h-[500px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-foreground rounded-full z-10" />
                <div className="w-full h-full bg-goride-green-light rounded-[2.5rem] overflow-hidden">
                  {/* App Screen */}
                  <div className="h-full flex flex-col p-4 pt-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-xs text-muted-foreground">Good morning</div>
                        <div className="text-lg font-semibold text-foreground">Jean Pierre</div>
                      </div>
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">JP</span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-background rounded-xl p-4 shadow-sm mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full" />
                        <span className="text-sm text-muted-foreground">Where to?</span>
                      </div>
                    </div>

                    {/* Quick Locations */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-background rounded-lg p-3 text-center">
                        <div className="text-xs font-medium text-foreground">Home</div>
                      </div>
                      <div className="flex-1 bg-background rounded-lg p-3 text-center">
                        <div className="text-xs font-medium text-foreground">Work</div>
                      </div>
                    </div>

                    {/* Map Preview */}
                    <div className="flex-1 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Smartphone className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -left-12 top-1/4 bg-card rounded-xl shadow-lg p-3 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-goride-amber-light rounded-full flex items-center justify-center">
                    <span className="text-accent font-bold text-xs">★</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">4.9 Rating</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 bottom-1/3 bg-card rounded-xl shadow-lg p-3 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-goride-green-light rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">✓</span>
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">Ride Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
