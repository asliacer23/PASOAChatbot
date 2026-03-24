import { Card, CardContent } from "@/components/ui/card";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image?: string;
  category: "adviser" | "chairperson" | "member";
  arcIndex: number;
}

interface TeamMemberCardProps {
  member: TeamMember;
}

const arcRotations = [0, 28, 55, 82, 110, 138, 165, 192, 220, 248, 275, 302, 330];
const ARC_RADIUS = 76;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
const ARC_VISIBLE_RATIO = 0.87;
const ARC_VISIBLE_LENGTH = ARC_CIRCUMFERENCE * ARC_VISIBLE_RATIO;
const ARC_GAP_LENGTH = ARC_CIRCUMFERENCE - ARC_VISIBLE_LENGTH;

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const rotation = arcRotations[member.arcIndex % arcRotations.length];
  const gradientId = `arc-gradient-${member.id}`;

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-up">
      <div className="relative h-56 w-56">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          <g transform={`rotate(${rotation - 90} 100 100)`}>
            <circle
              cx="100"
              cy="100"
              r={ARC_RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={`${ARC_VISIBLE_LENGTH} ${ARC_GAP_LENGTH}`}
            />
          </g>
        </svg>

        <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="text-6xl font-bold text-primary/20">
                {member.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card className="w-72 max-w-full border-border/30 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-6 text-center space-y-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2">
              {member.name}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-primary mt-1">
              {member.role}
            </p>
          </div>
          {member.description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {member.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
