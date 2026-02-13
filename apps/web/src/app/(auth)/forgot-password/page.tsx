import { AuthPage } from "@components/auth-page";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { Alert } from "antd";
import { redirect } from "next/navigation";

export default async function ForgotPassword({
  searchParams,
}: PageProps<"/update-password">) {
  const query = await searchParams;
  const data = await getData();

  // console.log("!forgotPassword", query);
  if (data.authenticated) {
    redirect(data?.redirectTo || "/");
  }
  // console.log("!redirect")

  // return null
  return (
    <AuthPage
      title={
        query.error &&
        query.error_code && (
          <Alert
            title={
              `${query.error}`
              // <>
              //   <br>{query.error_code}</br>:{query.error}
              // </>
            }
            description={`${query.error_code}: ${query.error_description}`}
            showIcon
            closable
          />
        )
      }
      type="forgotPassword"
    />
  );
}

async function getData() {
  const { authenticated, redirectTo, error } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
    error,
  };
}
