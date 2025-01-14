import { Button, ButtonProps, Input, Stack, useColorModeValue } from "@chakra-ui/react";
import { useColorMode } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FaBug, FaDiscord, FaEnvelope, FaGithub } from "react-icons/fa";
import { AuthLayout } from "src/components/AuthLayout";
import { Footer } from "src/components/Footer";
import { Header } from "src/components/Header";
import { Role, RoleSelect } from "src/components/RoleSelect";

export type SignInErrorTypes =
  | "Signin"
  | "OAuthSignin"
  | "OAuthCallback"
  | "OAuthCreateAccount"
  | "EmailCreateAccount"
  | "Callback"
  | "OAuthAccountNotLinked"
  | "EmailSignin"
  | "CredentialsSignin"
  | "SessionRequired"
  | "default";

const errorMessages: Record<SignInErrorTypes, string> = {
  Signin: "Try signing in with a different account.",
  OAuthSignin: "Try signing in with a different account.",
  OAuthCallback: "Try signing in with the same account you used originally.",
  OAuthCreateAccount: "Try signing in with a different account.",
  EmailCreateAccount: "Try signing in with a different account.",
  Callback: "Try signing in with a different account.",
  OAuthAccountNotLinked: "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "The e-mail could not be sent.",
  CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
  SessionRequired: "Please sign in to access this page.",
  default: "Unable to sign in.",
};

interface SigninProps {
  providers: Awaited<ReturnType<typeof getProviders>>;
}

function Signin({ providers }: SigninProps) {
  const router = useRouter();
  const { discord, email, github, credentials } = providers;
  const emailEl = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const err = router?.query?.error;
    if (err) {
      if (typeof err === "string") {
        setError(errorMessages[err]);
      } else {
        setError(errorMessages[err[0]]);
      }
    }
  }, [router]);

  const signinWithEmail = (data: { email: string }) => {
    signIn(email.id, { callbackUrl: "/dashboard", email: data.email });
  };

  const { colorMode } = useColorMode();
  const bgColorClass = colorMode === "light" ? "bg-gray-50" : "bg-chakra-gray-900";
  const buttonBgColor = colorMode === "light" ? "#2563eb" : "#2563eb";
  const { register, handleSubmit } = useForm<{ email: string }>();
  return (
    <div className={bgColorClass}>
      <Head>
        <title>Sign Up - Open Assistant</title>
        <meta name="Sign Up" content="Sign up to access Open Assistant" />
      </Head>
      <AuthLayout>
        <Stack spacing="2">
          {credentials && <DebugSigninForm credentials={credentials} bgColorClass={bgColorClass} />}
          {email && (
            <form onSubmit={handleSubmit(signinWithEmail)}>
              <Stack>
                <Input
                  type="email"
                  data-cy="email-address"
                  variant="outline"
                  size="lg"
                  placeholder="Email Address"
                  {...register("email")}
                />
                <SigninButton data-cy="signin-email-button" leftIcon={<FaEnvelope />}>
                  Continue with Email
                </SigninButton>
              </Stack>
            </form>
          )}
          {discord && (
            <Button
              bg={buttonBgColor}
              _hover={{ bg: "#4A57E3" }}
              _active={{
                bg: "#454FBF",
              }}
              size="lg"
              leftIcon={<FaDiscord />}
              color="white"
              onClick={() => signIn(discord.id, { callbackUrl: "/" })}
              // isDisabled="false"
            >
              Continue with Discord
            </Button>
          )}
          {github && (
            <Button
              bg="#333333"
              _hover={{ bg: "#181818" }}
              _active={{
                bg: "#101010",
              }}
              size={"lg"}
              leftIcon={<FaGithub />}
              colorScheme="blue"
              // isDisabled="false"
            >
              Continue with Github
            </Button>
          )}
        </Stack>
        <hr className="mt-14 mb-4 h-px bg-gray-200 border-0" />
        <div className="text-center">
          By signing up you agree to our <br></br>
          <Link href="/terms-of-service" aria-label="Terms of Service" className="hover:underline underline-offset-4">
            <b>Terms of Service</b>
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" aria-label="Privacy Policy" className="hover:underline underline-offset-4">
            <b>Privacy Policy</b>
          </Link>
          .
        </div>
        {error && (
          <div className="text-center mt-8">
            <p className="text-orange-600">Error: {error}</p>
          </div>
        )}
      </AuthLayout>
    </div>
  );
}

Signin.getLayout = (page) => (
  <div className="grid grid-rows-[min-content_1fr_min-content] h-full justify-items-stretch">
    <Header transparent={true} />
    {page}
    <Footer />
  </div>
);

export default Signin;

const SigninButton = (props: ButtonProps) => {
  const buttonColorScheme = useColorModeValue("blue", "dark-blue-btn");

  return (
    <Button
      size={"lg"}
      leftIcon={<FaEnvelope />}
      type="submit"
      colorScheme={buttonColorScheme}
      color="white"
      {...props}
    ></Button>
  );
};

interface DebugSigninFormData {
  username: string;
  role: Role;
}

const DebugSigninForm = ({ credentials, bgColorClass }: { credentials: ClientSafeProvider; bgColorClass: string }) => {
  const { register, handleSubmit } = useForm<DebugSigninFormData>({
    defaultValues: {
      role: "general",
      username: "dev",
    },
  });

  function signinWithDebugCredentials(data: DebugSigninFormData) {
    signIn(credentials.id, {
      callbackUrl: "/dashboard",
      ...data,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(signinWithDebugCredentials)}
      className="border-2 border-orange-600 rounded-md p-4 relative"
    >
      <span className={`text-orange-600 absolute -top-3 left-5 ${bgColorClass} px-1`}>For Debugging Only</span>
      <Stack>
        <Input variant="outline" size="lg" placeholder="Username" {...register("username")} />
        <RoleSelect {...register("role")}></RoleSelect>
        <SigninButton leftIcon={<FaBug />}>Continue with Debug User</SigninButton>
      </Stack>
    </form>
  );
};

export const getServerSideProps: GetServerSideProps<SigninProps> = async () => {
  const providers = await getProviders();
  return {
    props: {
      providers,
    },
  };
};
