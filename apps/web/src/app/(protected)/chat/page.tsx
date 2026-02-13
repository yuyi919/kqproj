"use client";

import { MemberAvatars } from "@components/Avatar";
import { Group } from "@components/chat";
import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  MarkdownField,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, useMany } from "@refinedev/core";
import { Space, Table } from "antd";

export default function BlogPostList() {
  const { result, tableProps } = useTable<Group>({
    resource: "groups",
    syncWithLocation: true,
    meta: {
      select: "*, members:group_members(id:user_id,meta:users(*))",
    },
  });

  // const {
  //   result: { data: categories },
  //   query: { isLoading: categoryIsLoading },
  // } = useMany({
  //   resource: "groups",
  //   ids:
  //     result?.data?.map((item) => item?.categories?.id).filter(Boolean) ?? [],
  //   queryOptions: {
  //     enabled: !!result?.data,
  //   },
  // });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title={"ID"} />
        <Table.Column dataIndex="name" title={"Name"} />
        <Table.Column
          dataIndex="description"
          title={"Description"}
          render={(value: any) => {
            if (!value) return "-";
            return <MarkdownField value={value.slice(0, 80) + "..."} />;
          }}
        />
        <Table.Column
          dataIndex={"members"}
          title={"Members"}
          render={(value: Group["members"]) =>
            !value ? (
              <></>
            ) : (
              <MemberAvatars members={value} max={{ count: 3 }} />
            )
          }
        />
        {/* <Table.Column dataIndex="status" title={"Status"} /> */}
        <Table.Column
          dataIndex={["created_at"]}
          title={"Created at"}
          render={(value: any) => (
            <DateField format="YYYY-MM-DD HH:mm:ss" value={value} />
          )}
        />
        <Table.Column
          dataIndex="actions"
          render={(_, record: BaseRecord) => (
            <Space>
              {/* <EditButton hideText size="small" recordItemId={record.id} /> */}
              <ShowButton hideText size="small" recordItemId={record.id} />
              {/* <DeleteButton hideText size="small" recordItemId={record.id} /> */}
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
