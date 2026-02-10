"use client";

import { Route, Switch, useRouter, VirtualRouter } from "@/lib/clerk-router";
import { useServerAuth } from "@contexts/server-auth";
import { useAuthIdentity } from "@hooks/use-user";
import { useT } from "@i18n";
import { UserMeta } from "@interfaces/user";
import { SaveButton, useForm } from "@refinedev/antd";
import { HttpError, useInvalidate } from "@refinedev/core";
import { rpc } from "@utils/api/rpc";
import { Avatar, Button, Card, Form, Input, message, Spin, Upload } from "antd";
import { Camera, Loader2, User } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <VirtualRouter initialPath="/profile">
        <Card2>
          <Switch>
            <Route path="/profile" component={UserProfile} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </Card2>
      </VirtualRouter>
    </div>
  );
}
function Card2({ children }: { children: React.ReactNode }) {
  const { currentPath } = useRouter();
  return <Card title={currentPath}>{children}</Card>;
}

function Settings() {
  const { navigate } = useRouter();
  return <Button onClick={() => navigate("/profile")}>Profile</Button>;
}

function UserProfile() {
  const { navigate } = useRouter();

  const t = useT();
  const {
    data: user,
    isLoading: isIdentityLoading,
    refetch: refetchIdentity,
  } = useAuthIdentity({
    queryOptions: {
      initialData: useServerAuth(),
    },
  });
  const invalidate = useInvalidate();
  const [uploading, setUploading] = useState(false);

  const {
    formProps,
    saveButtonProps,
    query: queryResult,
  } = useForm<UserMeta, HttpError, UserMeta>({
    resource: "users",
    action: "edit",
    id: user?.id,
    queryOptions: {
      enabled: !!user?.id,
      ...(user ? { initialData: { data: user.meta } } : undefined),
    },
    redirect: false,
    successNotification: false,
    mutationMode: "optimistic",
    onMutationSuccess: () => {
      message.success(
        t.path.notifications.editSuccess({
          resource: t.path.resource.profile(),
        }),
      );
      refetchIdentity();
    },
  });
  // Watch for avatar_url changes to update the preview immediately
  const avatarUrl = Form.useWatch("avatar_url", formProps.form);

  // Keep form values in sync with fetched data
  const profileData = queryResult?.data?.data;
  // useEffect(() => {
  //   if (user) {
  //     formProps.form?.setFieldsValue({
  //       username: user.username,
  //       email: user.email,
  //       avatar_url: user.avatar_url,
  //     });
  //   }
  // }, [user, formProps.form]);

  // if (isIdentityLoading) {
  //   return (
  //     <Card>
  //       <Skeleton active avatar paragraph={{ rows: 4 }} />
  //     </Card>
  //   );
  // }

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await rpc.users.avatar.$post({
        // method: "POST",
        form: {
          file,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        // @ts-expect-error
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      message.success(
        t.path.notifications.uploadSuccess({ resource: t.path.avatar() }),
      );

      // Update form field immediately for preview
      formProps.form?.setFieldValue("avatar_url", data.url);

      // Invalidate the query to refresh the data source
      invalidate({
        resource: "users",
        id: user?.id,
        invalidates: ["detail"],
      });

      // Update identity for header
      refetchIdentity();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      title={t.path.pages.settings.profile.title()}
      loading={isIdentityLoading || queryResult?.isLoading}
      actions={[
        <Button onClick={() => navigate("/settings")}>Go Settings</Button>,
      ]}
    >
      <div className="flex flex-col items-center mb-8">
        <Upload
          showUploadList={false}
          accept="image/png,image/jpeg,image/gif,image/webp"
          beforeUpload={(file) => {
            const isImage = file.type.startsWith("image/");
            if (!isImage) {
              message.error("You can only upload image files!");
              return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
              message.error("Image must be smaller than 5MB!");
              return Upload.LIST_IGNORE;
            }
            handleUpload(file);
            return false; // Prevent default upload behavior
          }}
        >
          <div className="group relative cursor-pointer">
            <Avatar
              key={avatarUrl || profileData?.avatar_url}
              size={120}
              src={avatarUrl || profileData?.avatar_url}
              icon={<User size={64} />}
              className="border-4 border-gray-100 dark:border-gray-800"
            />

            {/* Overlay for upload instruction */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-all duration-200 backdrop-blur-sm">
              <Camera className="text-white w-8 h-8 opacity-90" />
            </div>

            {/* Loading State */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                <Spin
                  indicator={
                    <Loader2 className="animate-spin text-white w-8 h-8" />
                  }
                />
              </div>
            )}
          </div>
        </Upload>
        <p className="mt-3 text-sm text-gray-500">
          {t.path.pages.settings.profile.uploadAvatarHint()}
        </p>
      </div>
      <div className="flex justify-center">
        <Form {...formProps} layout="vertical" className="max-w-md min-w-xs">
          <Form.Item
            label={t.path.fields.username()}
            name="username"
            rules={[
              {
                required: true,
                message: t.path.validation.required({
                  field: t.path.fields.username(),
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t.path.fields.email()}
            name="email"
            rules={[
              {
                required: true,
                message: t.path.validation.required({
                  field: t.path.fields.email(),
                }),
              },
              {
                type: "email",
                message: t.path.validation.email(),
              },
            ]}
          >
            <Input disabled />
          </Form.Item>

          {/* Hidden avatar_url field to maintain state */}
          <Form.Item name="avatar_url" hidden>
            <Input />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <SaveButton {...saveButtonProps} />
          </div>
        </Form>
      </div>
    </Card>
  );
}
