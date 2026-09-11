import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account on Clavis to unlock Socratic AI tutoring and Canvas LMS course intelligence.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
