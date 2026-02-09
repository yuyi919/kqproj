"use client";

import { UserMeta } from "@interfaces/user";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import React from "react";

export default function CategoryEdit() {
  const { formProps, saveButtonProps } = useForm<UserMeta>({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Name"}
          name={["username"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
}
