import {
  AntDesignOutlined,
  ApiOutlined,
  CodeOutlined,
  EditOutlined,
  FileImageOutlined,
  OpenAIFilled,
  OpenAIOutlined,
  PaperClipOutlined,
  ProfileOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Sender, SenderProps, Suggestion } from "@ant-design/x";
import type {
  SkillType,
  SlotConfigType,
} from "@ant-design/x/es/sender/interface";
import {
  Button,
  Divider,
  Dropdown,
  Flex,
  GetProp,
  GetRef,
  MenuProps,
  message,
} from "antd";
import React, { useEffect, useRef, useState } from "react";

const Switch = Sender.Switch;

const AgentInfo: {
  [key: string]: {
    icon: React.ReactNode;
    label: string;
    slotConfig: SenderProps["slotConfig"];
  };
} = {
  deep_search: {
    icon: <SearchOutlined />,
    label: "Deep Search",
    slotConfig: [
      { type: "text", value: "Please help me search for news about " },
      {
        type: "select",
        key: "search_type",
        props: {
          options: ["AI", "Technology", "Entertainment"],
          placeholder: "Please select a category",
        },
      },
      { type: "text", value: " and summarize it into a list." },
      //   {
      //     type: "tag",
      //     key: "tag",
      //     props: { label: "@Travel Planner ", value: "travelTool" },
      //   },
    ],
  },
  ai_code: {
    icon: <CodeOutlined />,
    label: "AI Code",
    slotConfig: [
      { type: "text", value: "Please use " },
      {
        type: "select",
        key: "code_lang",
        props: {
          options: ["JS", "C++", "Java"],
          placeholder: "Please select a programming language",
        },
      },
      { type: "text", value: " to write a mini game." },
    ],
  },
  ai_writing: {
    icon: <EditOutlined />,
    label: "Writing",
    slotConfig: [
      { type: "text", value: "Please write an article about " },
      {
        type: "select",
        key: "writing_type",
        props: {
          options: ["Campus", "Travel", "Reading"],
          placeholder: "Please enter a topic",
        },
      },
      { type: "text", value: ". The requirement is " },
      {
        type: "input",
        key: "writing_num",
        props: {
          defaultValue: "800",
          placeholder: "Please enter the number of words.",
        },
      },
      { type: "text", value: " words." },
    ],
  },
};

const IconStyle = {
  fontSize: 16,
};

const SwitchTextStyle = {
  display: "inline-flex",
  width: 28,
  justifyContent: "center",
  alignItems: "center",
};

const FileInfo: {
  [key: string]: {
    icon: React.ReactNode;
    label: string;
  };
} = {
  file_image: {
    icon: <FileImageOutlined />,
    label: "x-image",
  },
};

export const ChatInput: React.FC<{
  isPending?: boolean;
  onInput(e: {
    value: string;
    slotConfig: SlotConfigType[];
    skill?: SkillType;
  }): any;
}> = ({ onInput, isPending: loading = false }) => {
  type SuggestionItems = Exclude<
    GetProp<typeof Suggestion, "items">,
    () => void
  >;
  const [deepThink, setDeepThink] = useState<boolean>(true);
  const [activeAgentKey, setActiveAgentKey] = useState("deep_search");
  const agentItems: MenuProps["items"] = Object.keys(AgentInfo).map((agent) => {
    const { icon, label } = AgentInfo[agent];
    return {
      key: agent,
      icon,
      label,
    };
  });

  const fileItems = Object.keys(FileInfo).map((file) => {
    const { icon, label } = FileInfo[file];
    return {
      key: file,
      icon,
      label,
    };
  });

  const senderRef = useRef<GetRef<typeof Sender>>(null);

  const agentItemClick: MenuProps["onClick"] = (item) => {
    setActiveAgentKey(item.key);
  };
  const fileItemClick: MenuProps["onClick"] = (item) => {
    // console.log(item);
    const { icon, label } = FileInfo[item.key];
    senderRef.current?.insert?.([
      {
        type: "tag",
        key: `${item.key}_${Date.now()}`,
        props: {
          label: (
            <Flex gap="small">
              {icon}
              {label}
            </Flex>
          ),
          value: item.key,
        },
      },
    ]);
  };

  // Mock send message
  useEffect(() => {
    if (loading) {
      let active: boolean = true;
      (async function () {
        if (senderRef.current) {
          if (active) {
            senderRef.current?.clear?.();
            // setLoading(false);
          }
        }
        // message.success("Send message successfully!");
      })();
      //   const timer = setTimeout(() => {
      //   }, 3000);
      return () => {
        active = false;
      };
    }
  }, [loading]);

  const suggestions: SuggestionItems = [
    { label: "Write a report", value: "report" },
    { label: "Draw a picture", value: "draw" },
    {
      label: "Check some knowledge",
      value: "knowledge",
      icon: <OpenAIFilled />,
      children: [
        {
          label: "About React",
          value: "react",
        },
        {
          label: "About Ant Design",
          value: "antd",
        },
      ],
    },
  ];

  const senderProps = {
    loading: loading,
    ref: senderRef,
    placeholder: "Press Enter to send message",
    suffix: false,
    allowSpeech: false,
    footer: (actionNode) => {
      return (
        <Flex justify="space-between" align="center">
          <Flex gap="small" align="center">
            <Button
              style={IconStyle}
              type="text"
              icon={<PaperClipOutlined />}
            />
            <Switch
              value={deepThink}
              checkedChildren={
                <>
                  Deep Think:<span style={SwitchTextStyle}>on</span>
                </>
              }
              unCheckedChildren={
                <>
                  Deep Think:<span style={SwitchTextStyle}>off</span>
                </>
              }
              onChange={(checked: boolean) => {
                setDeepThink(checked);
              }}
              icon={<OpenAIOutlined />}
            />
            <Dropdown
              menu={{
                selectedKeys: [activeAgentKey],
                onClick: agentItemClick,
                items: agentItems,
              }}
            >
              <Switch value={false} icon={<AntDesignOutlined />}>
                Agent
              </Switch>
            </Dropdown>
            {fileItems?.length ? (
              <Dropdown menu={{ onClick: fileItemClick, items: fileItems }}>
                <Switch value={false} icon={<ProfileOutlined />}>
                  Files
                </Switch>
              </Dropdown>
            ) : null}
          </Flex>
          <Flex align="center">
            <Button type="text" style={IconStyle} icon={<ApiOutlined />} />
            <Divider orientation="vertical" />
            {actionNode}
          </Flex>
        </Flex>
      );
    },
    onSubmit: (value, slotConfig, skill) => {
      onInput({ value, slotConfig: slotConfig!, skill });
    },
    slotConfig: AgentInfo[activeAgentKey].slotConfig,
    // onCancel:() => {
    //   // setLoading(false);
    //   message.error("Cancel sending!");
    // }
  } satisfies SenderProps & {
    ref: typeof senderRef;
  };

  return (
    <Flex vertical gap="middle" style={{ height: "100%" }}>
      {/* <Suggestion
        styles={{ content: { height: "100%" } }}
        items={suggestions}
        onSelect={() => {
          senderRef.current?.insert?.(
            [
              {
                type: "content",
                key: `partner_2_${Date.now()}`,
                props: { placeholder: "Enter a name" },
              },
            ],
            "cursor",
            "@"
          );
        }}
      >
        {({ onTrigger, onKeyDown }) => {
          return (
            <Sender
              {...senderProps}
              autoSize={{ minRows: 3, maxRows: 6 }}
              onKeyDown={(e) => {
                if (e.key === "@") {
                  onTrigger();
                }
                return onKeyDown(e);
              }}
            />
          );
        }}
      </Suggestion> */}
      <Sender styles={styles} {...senderProps} />
    </Flex>
  );
};
const styles: SenderProps["styles"] = {
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "none",
  },
  input: {
    alignSelf: "start",
  },
  content: { height: "100%" },
};
