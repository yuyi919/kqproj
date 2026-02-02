import { AuthPage } from "@components/auth-page";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { redirect } from "next/navigation";

export default async function UpdatePassword({
  searchParams,
}: PageProps<"/update-password">) {
  const query = await searchParams;
  if (query.error && query.error_code) {
    await authProviderServer.logout();
    redirect(
      `/forgot-password?error=${query.error}&error_code=${query.error_code}&error_description=${query.error_description}`
    );
  }
  
  const data = await getData();

  if (data.authenticated) {
    redirect(data?.redirectTo || "/");
  }

  return <AuthPage type="updatePassword" />;
}

async function getData() {
  const { authenticated, redirectTo, error } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
    error,
  };
}
