"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpRoute() {
    return (
        <main className="flex h-screen items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8">
                <div className="flex flex-col items-center text-center mb-8">
                    <h1 className="text-3xl font-light tracking-tight mb-2">Create your space</h1>
                    <p className="text-muted-foreground text-sm">Join the platform to optimize your daily focus engines.</p>
                </div>
                <SignUp 
                    routing="hash" 
                    forceRedirectUrl="/dashboard" 
                    signInUrl="/sign-in" 
                    appearance={{
                        elements: {
                            card: {
                                boxShadow: 'none',
                                backgroundColor: 'transparent'
                            },
                            header: "hidden",
                            formButtonPrimary: "bg-blue-300 hover:bg-blue-400 text-white rounded-full shadow-none py-3 font-medium transition-colors text-sm",
                            formFieldInput: "border-b-2 border-border rounded-none focus:ring-0 focus:border-blue-400 bg-transparent p-2 text-foreground transition-colors shadow-none",
                            formFieldLabel: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                            socialButtonsBlockButton: "border border-border hover:bg-surface rounded-full py-3 shadow-none transition-colors",
                            socialButtonsBlockButtonText: "text-foreground font-medium",
                            dividerLine: "bg-border",
                            dividerText: "text-muted-foreground text-xs uppercase tracking-widest",
                            footerActionText: "text-muted-foreground",
                            footerActionLink: "text-blue-400 hover:text-blue-500 font-medium transition-colors",
                            formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                            identityPreview: "bg-surface border border-border rounded-xl p-3",
                            identityPreviewText: "text-foreground",
                            identityPreviewEditButtonIcon: "text-blue-400",
                            formResendCodeLink: "text-blue-400 hover:text-blue-500",
                            otpCodeFieldInput: "border-b-2 border-border bg-transparent text-foreground rounded-none focus:border-blue-400",
                        }
                    }}
                />
            </div>
        </main>
    );
}