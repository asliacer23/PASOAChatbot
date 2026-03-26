import { ArrowLeft, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamMemberCard } from "./TeamMemberCard";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image?: string;
  category: "adviser" | "chairperson" | "member";
  arcIndex: number;
}

const teamMembers: TeamMember[] = [
  {
    id: "adviser-1",
    name: "RENZ CATHERINE G. DOMINGO, Phd",
    role: "",
    description: "",
    category: "adviser",
    image: "/images/team/RENZ CATHERINE G. DOMINGO, Phd.png",
    arcIndex: 0,
  },
  {
    id: "chairmen-1",
    name: "ALEXIS JOHN M. OBENITA",
    role: "Research Chairmen",
    description: "",
    category: "chairperson",
    image: "/images/team/ALEXIS JOHN M. OBENITA (CHAIRMEN).png",
    arcIndex: 1,
  },
  {
    id: "chairwoman-1",
    name: "ERICH TRIXIA P. TOLENTINO",
    role: "Research Chairwoman",
    description: "",
    category: "chairperson",
    image: "/images/team/ERICH TRIXIA P. TOLENTINO(CHAIRWOMAN).jpg",
    arcIndex: 2,
  },
  // 10 Team Members
  {
    id: "member-1",
    name: "ABDUL MADID H. POLANGI",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/ABDUL MADID H. POLANGI.png",
    arcIndex: 3,
  },
  {
    id: "member-2",
    name: "AIRA L. ALARCON",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/AIRA L. ALARCON.png",
    arcIndex: 4,
  },
  {
    id: "member-3",
    name: "ALEA MAE C. CHAVEZ",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/ALEA MAE C. CHAVEZ.png",
    arcIndex: 5,
  },
  {
    id: "member-4",
    name: "ANGELICA C. BELTRAN",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/ANGELICA C. BELTRAN.jpg",
    arcIndex: 6,
  },
  {
    id: "member-5",
    name: "GARVIN ROSS L. BALANDAY",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/GARVIN ROSS L. BALANDAY.png",
    arcIndex: 7,
  },
  {
    id: "member-6",
    name: "GIFT VINIEZ N. GUECO",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/GIFT VINIEZ N. GUECO.png",
    arcIndex: 8,
  },
  {
    id: "member-7",
    name: "JHASTINE ALVI N. IMBUIDO",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/JHASTINE ALVI N. IMBUIDO.png",
    arcIndex: 9,
  },
  {
    id: "member-8",
    name: "JOHN MARK G. PAIMAN",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/JOHN MARK G. PAIMAN.png",
    arcIndex: 10,
  },
  {
    id: "member-9",
    name: "NICOLE C. ARAULLO",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/NICOLE C. ARAULLO.png",
    arcIndex: 11,
  },
  {
    id: "member-10",
    name: "PERCEL DT. MOSENDE",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/PERCEL DT. MOSENDE.png",
    arcIndex: 12,
  },
  {
    id: "member-11",
    name: "JEROME YRREJ S. EBAJO",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/JEROME YRREJ S. EBAJO.png",
    arcIndex: 13,
  },
  {
    id: "member-12",
    name: "PRINCESS O. SIAZON",
    role: "Member",
    description: "",
    category: "member",
    image: "/images/team/members/PRINCESS O. SIAZON.png",
    arcIndex: 14,
  },
];

export function AcknowledgementsPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };
  const adviser = teamMembers.filter((m) => m.category === "adviser");
  const chairpersons = teamMembers.filter((m) => m.category === "chairperson");
  const members = teamMembers.filter((m) => m.category === "member");

  // Refs for scroll animation
  const adviserRef = useRef<HTMLDivElement>(null);
  const chairpersonsRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const [visibleSections, setVisibleSections] = useState({
    adviser: false,
    chairpersons: false,
    members: false,
    about: false,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const dataLabel = entry.target.getAttribute("data-section");
            if (dataLabel) {
              setVisibleSections((prev) => ({
                ...prev,
                [dataLabel]: true,
              }));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const refs = [adviserRef, chairpersonsRef, membersRef, aboutRef];
    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      refs.forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12 animate-fade-up">
        {/* Header */}
        <section className="space-y-6">
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={handleBack}
              className="rounded-xl border-primary/30 bg-background/80 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4 text-center">
            
             
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Our Team
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Meet the dedicated team behind the PASOA Student Hub. Their expertise and commitment drive our mission to provide exceptional support.
              </p>
            </div>
          </div>
        </section>

        {/* Research Adviser Section */}
        {adviser.length > 0 && (
          <section
            ref={adviserRef}
            data-section="adviser"
            className={`space-y-6 transition-all duration-700 ${
              visibleSections.adviser
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Research Adviser</h2>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <TeamMemberCard member={adviser[0]} />
              </div>
            </div>
          </section>
        )}

        {/* Research Chairpersons Section */}
        {chairpersons.length > 0 && (
          <section
            ref={chairpersonsRef}
            data-section="chairpersons"
            className={`space-y-6 transition-all duration-700 ${
              visibleSections.chairpersons
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Research Chair{chairpersons.length > 1 ? "persons" : "person"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto place-items-center">
              {chairpersons.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* Research Team Members Section */}
        {members.length > 0 && (
          <section
            ref={membersRef}
            data-section="members"
            className={`space-y-6 transition-all duration-700 ${
              visibleSections.members
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold">Research Team</h2>
              <p className="text-muted-foreground mt-2">
                {members.length} dedicated team members
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center">
              {members.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State Message */}
        {members.length === 0 && chairpersons.length === 0 && (
          <Card className="border-border/30 bg-accent/10">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Team members information will be added soon...
              </p>
            </CardContent>
          </Card>
        )}

        {/* About Section */}
        <div
          ref={aboutRef}
          data-section="about"
          className={`border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background transition-all duration-700 rounded-lg shadow-sm p-6 md:p-8 ${
            visibleSections.about
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold">About This Project</h3>
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              The PASOA Student Hub is a comprehensive solution designed to provide intelligent,
              responsive support to students and faculty. This project represents the collaborative
              effort of our talented research team, combining cutting-edge AI technology with a deep
              understanding of educational needs.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to continuous improvement and innovation, ensuring that our chatbot
              system delivers the highest quality assistance and support to our users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}








