import pasoaLogo from "@/assets/pasoa-logo.png";

interface PasoaLoadingScreenProps {
  message?: string;
}

export function PasoaLoadingScreen({
  message = "Loading PASOA Student Hub...",
}: PasoaLoadingScreenProps) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-accent/5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 px-4 text-center">
        <div className="relative h-36 w-36">
          <svg
            className="absolute inset-0 h-full w-full animate-logo-circulate"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="pasoa-loading-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="82"
              fill="none"
              stroke="url(#pasoa-loading-ring)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="420 120"
            />
          </svg>

          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-white/95 shadow-lg flex items-center justify-center">
            <img
              src={pasoaLogo}
              alt="PASOA Student Hub"
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>

        <p className="text-sm sm:text-base font-medium text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
