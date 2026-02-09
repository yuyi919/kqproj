"use client";

import React, { useState } from "react";
import {
  useList,
  useCustomMutation,
  useGo,
} from "@refinedev/core";
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  LoginOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { NoSSR } from "@components/NoSSR";
import { useAuthUser } from "@hooks/use-user";

interface IGameRoom {
  id: string;
  name: string;
  host_id: string;
  status: "waiting" | "playing" | "finished";
  created_at: string;
  config: {
    maxPlayers?: number;
    [key: string]: any;
  };
  players?: { count: number }[];
  host?: { username: string; avatar_url: string };
}

export default function LobbyPage() {
  const go = useGo();
  const user = useAuthUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch Rooms List
  const { query } = useList<IGameRoom>({
    resource: "game_rooms",
    meta: {
      select:
        "*, players:game_players(count), host:users(username, avatar_url)",
    },
    liveMode: "auto", // Enable realtime updates if configured
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });
  const { data, isLoading, refetch } = query;

  // Create Room Mutation
  const { mutate: createRoom, mutation } = useCustomMutation<IGameRoom>({});
  const isCreating = mutation.isPending;
  // Join Room Mutation
  const { mutate: joinRoom, mutation: joinRoomMutation } = useCustomMutation();
  const isJoining = joinRoomMutation.isPending;

  const handleCreateRoom = (values: any) => {
    createRoom(
      {
        url: "/api/game/rooms",
        method: "post",
        values: {
          name: values.name,
          config: {
            maxPlayers: values.maxPlayers,
          },
        },
      },
      {
        onSuccess: (response) => {
          message.success("Room created successfully!");
          setIsModalVisible(false);
          form.resetFields();
          // Redirect to room
          go({
            to: `/room/${response.data.id}`,
            type: "push",
          });
        },
        onError: (error) => {
          message.error("Failed to create room: " + error.message);
        },
      },
    );
  };

  const handleJoinRoom = (room: IGameRoom) => {
    joinRoom(
      {
        url: `/api/game/rooms/${room.id}/join`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Joined room!");
          go({
            to: `/room/${room.id}`,
            type: "push",
          });
        },
        onError: (error: any) => {
          // If already joined, just redirect
          if (error?.response?.data?.message === "Already joined") {
            go({
              to: `/room/${room.id}`,
              type: "push",
            });
          } else {
            message.error(
              "Failed to join room: " +
                (error?.response?.data?.error || error.message),
            );
          }
        },
      },
    );
  };

  const columns = [
    {
      title: "Room Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Host",
      dataIndex: "host",
      key: "host",
      render: (host: any) => (
        <Space>
          <UserOutlined />
          {host?.username || "Unknown"}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "waiting") color = "green";
        if (status === "playing") color = "blue";
        if (status === "finished") color = "red";
        return (
          <Tag color={color} key={status}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Players",
      key: "players",
      render: (_: any, record: IGameRoom) => {
        const current = record.players?.[0]?.count || 0;
        const max = record.config?.maxPlayers || 7;
        return (
          <span>
            {current} / {max}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: IGameRoom) => {
        const isFull =
          (record.players?.[0]?.count || 0) >= (record.config?.maxPlayers || 7);
        const isWaiting = record.status === "waiting";

        return (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => handleJoinRoom(record)}
            disabled={!isWaiting || (isFull && record.host_id !== user?.id)} // Allow host to re-enter
            loading={isJoining}
          >
            Join
          </Button>
        );
      },
    },
  ];

  return (
    <NoSSR>
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Game Lobby</h1>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Create Match
            </Button>
          </Space>
        </div>

        <Card>
          <Table
            columns={columns}
            dataSource={data?.data}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title="Create New Match"
          open={isModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={isCreating}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateRoom}
            initialValues={{ maxPlayers: 7 }}
          >
            <Form.Item
              name="name"
              label="Room Name"
              rules={[{ required: true, message: "Please enter room name" }]}
            >
              <Input placeholder="Enter a name for your game" />
            </Form.Item>
            <Form.Item
              name="maxPlayers"
              label="Max Players"
              rules={[{ required: true }]}
            >
              <InputNumber min={2} max={12} className="w-full" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </NoSSR>
  );
}
