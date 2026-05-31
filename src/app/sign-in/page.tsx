"use client";

import { SignUpPage, Testimonial } from "@/components/sign-up";
import { SignIn } from "@clerk/nextjs";

const registrationTestimonials: Testimonial[] = [
    {
        avatarSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        name: "Sarah Chen",
        handle: "@sarah_dev",
        text: "The split layout lets me organize cross-room work sprints efficiently. Exceptional minimalist architecture."
    },
    {
        avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        name: "Marcus Johnson",
        handle: "@marcus_eng",
        text: "Zero friction interface. The WebRTC streams sync instantly and the design parameters protect deep focus blocks."
    }
];

export default function SignInRoute() {
    return (
        <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
            <SignUpPage
                title={<span className="font-light text-foreground tracking-tighter">Welcome Back</span>}
                description="Sign in to your account to continue"
                heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
                testimonials={registrationTestimonials}
            >
                <SignIn routing="hash" forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
            </SignUpPage>
        </main>
    );
}
