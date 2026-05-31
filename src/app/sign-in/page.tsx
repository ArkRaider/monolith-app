"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInRoute() {
    return (
        <main className="flex h-screen items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-8">
                <div className="flex flex-col items-center text-center mb-8">
                    <h1 className="text-3xl font-light tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
                </div>
                <SignIn 
                    routing="hash" 
                    forceRedirectUrl="/dashboard" 
                    signUpUrl="/sign-up" 
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
                        }
                    }}
                />
            </div>
        </main>
    );
}
