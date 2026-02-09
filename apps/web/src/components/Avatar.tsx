import { Group } from "@components/chat";
import { UserMeta } from "@interfaces/user";
import { Avatar, AvatarProps } from "antd";
import { AvatarGroupProps } from "antd/lib/avatar/AvatarGroup";

export const UserAvatar = ({
  user,
  ...props
}: { user?: UserMeta | null } & Omit<AvatarProps, "children">) => {
  return (
    <Avatar
      key={!!user + ""}
      src={user?.avatar_url}
      icon={user?.username?.slice(0, 1).toUpperCase()}
      {...props}
    ></Avatar>
  );
};

export const MemberAvatars = ({
  members,
  ...props
}: { members?: Group["members"] } & Omit<AvatarGroupProps, "children">) => {
  return (
    <Avatar.Group {...props}>
      {members?.map((member) => (
        <UserAvatar user={member.meta} />
      ))}
    </Avatar.Group>
  );
};
