"use client";

import { SignUpPage, Testimonial } from "@/components/sign-up";
import { SignUp } from "@clerk/nextjs";

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

export default function SignUpRoute() {
    return (
        <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
            <style dangerouslySetInnerHTML={{
                __html: `
                ::-webkit-scrollbar { display: none; }
                * { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            <SignUpPage
                heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
                testimonials={registrationTestimonials}
            >
                <div className="w-full mt-4">
                    <SignUp
                        routing="hash"
                        forceRedirectUrl="/dashboard"
                        signInUrl="/sign-in"
                        appearance={{
                            variables: {
                                colorBackground: 'transparent',
                                colorText: '#ffffff',
                                colorTextSecondary: '#9ca3af',
                                colorInputBackground: '#20201d',
                                colorInputText: '#ffffff',
                                borderRadius: '0px',
                                colorPrimary: '#787958',
                            },
                            elements: {
                                card: "bg-transparent shadow-none w-full p-0 flex flex-col gap-4",

                                // FORCING TEXT COLORS WITH ! (IMPORTANT)
                                headerTitle: "!text-white text-2xl font-semibold",
                                headerSubtitle: "!text-gray-400",

                                socialButtonsBlockButton: "border border-[#48473d] hover:bg-[#20201d] bg-transparent rounded-[var(--radius)] py-3 shadow-none transition-colors",
                                socialButtonsBlockButtonText: "!text-white font-medium",

                                dividerLine: "bg-[#48473d]",
                                dividerText: "!text-gray-400 text-xs uppercase tracking-widest",

                                formFieldLabel: "!text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider",
                                formFieldInput: "bg-[#20201d] border border-[#48473d] !text-white rounded-[var(--radius)] p-3 focus:border-[#787958] focus:ring-1 focus:ring-[#787958] transition-colors shadow-none",
                                formFieldInputShowPasswordButton: "!text-gray-400 hover:!text-white",

                                formButtonPrimary: "bg-[#e6e2dd] !text-[#141311] hover:bg-white rounded-[var(--radius)] py-3.5 text-sm font-bold uppercase tracking-wider shadow-none transition-colors mt-2",

                                footerActionText: "!text-gray-400",
                                footerActionLink: "!text-white hover:text-gray-300 transition-colors font-medium",

                                identityPreview: "bg-[#20201d] border border-[#48473d] rounded-[var(--radius)] p-3",
                                identityPreviewText: "!text-white",
                                identityPreviewEditButtonIcon: "!text-[#787958]",
                                formResendCodeLink: "!text-white hover:text-gray-300",
                                otpCodeFieldInput: "border border-[#48473d] bg-[#20201d] !text-white rounded-[var(--radius)] focus:border-[#787958]",
                            }
                        }}
                    />
                </div>
            </SignUpPage>
        </main>
    );
}