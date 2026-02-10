/**
 * Chinese (Simplified) translations
 * 简体中文翻译
 */

export const zhCN = {
  ID: "ID",
  avatar: "头像",
  pages: {
    login: {
      title: "登录您的账户",
      signin: "登录",
      signup: "注册",
      register: "注册",
      divider: "或",
      fields: {
        email: "邮箱",
        password: "密码",
      },
      errors: {
        requiredEmail: "邮箱是必填项",
        requiredPassword: "密码是必填项",
        validEmail: "请输入有效的邮箱地址",
      },
      buttons: {
        submit: "登录",
        forgotPassword: "忘记密码?",
        noAccount: "还没有账号?",
        haveAccount: "已有账号?",
        rememberMe: "记住我",
      },
    },
    forgotPassword: {
      title: "忘记密码了吗?",
      signin: "登录",
      fields: {
        email: "邮箱",
      },
      errors: {
        requiredEmail: "邮箱是必填项",
        validEmail: "请输入有效的邮箱地址",
      },
      buttons: {
        haveAccount: "已有账号?",
        submit: "发送重置说明",
      },
    },
    register: {
      title: "注册您的账户",
      signin: "登录",
      fields: {
        email: "邮箱",
        password: "密码",
      },
      errors: {
        requiredEmail: "邮箱是必填项",
        requiredPassword: "密码是必填项",
        validEmail: "请输入有效的邮箱地址",
      },
      buttons: {
        submit: "注册",
        haveAccount: "已有账号?",
      },
    },
    updatePassword: {
      title: "更新密码",
      fields: {
        password: "新密码",
        confirmPassword: "确认新密码",
      },
      errors: {
        confirmPasswordNotMatch: "密码不匹配",
      },
      buttons: {
        submit: "更新",
      },
    },
    error: {
      info: "您可能忘记将 {action} 组件添加到 {resource} 资源。",
      404: "抱歉，您访问的页面不存在。",
      resource404: "您确定已创建 {resource} 资源吗?",
      backHome: "返回首页",
    },
    settings: {
      profile: {
        title: "资料设置",
        uploadAvatarHint: "点击上传头像",
      },
    },
  },
  actions: {
    list: "列表",
    create: "创建",
    edit: "编辑",
    show: "查看",
    delete: "删除",
    save: "保存",
    cancel: "取消",
  },
  buttons: {
    create: "创建",
    save: "保存",
    logout: "退出登录",
    delete: "删除",
    edit: "编辑",
    cancel: "取消",
    confirm: "您确定吗?",
    filter: "筛选",
    clear: "清除",
    refresh: "刷新",
    show: "查看",
    undo: "撤销",
    import: "导入",
    clone: "克隆",
    notAccessTitle: "您没有访问权限",
  },
  warnWhenUnsavedChanges: "您有未保存的更改，确定要离开吗?",
  notifications: {
    success: "成功",
    error: "错误 (状态码: {statusCode})",
    undoable: "您有 {seconds} 秒时间撤销",
    createSuccess: "成功创建{resource}",
    createError: "创建{resource}时出错 (状态码: {statusCode})",
    deleteSuccess: "成功删除{resource}",
    deleteError: "删除{resource}时出错 (状态码: {statusCode})",
    editSuccess: "保存{resource}成功",
    editError: "保存{resource}时出错 (状态码: {statusCode})",
    importProgress: "正在导入: {processed}/{total}",
    uploadSuccess: "上传{resource}成功",
  },
  loading: "加载中",
  tags: {
    clone: "克隆",
  },
  dashboard: {
    title: "仪表板",
  },
  blog_posts: {
    blog_posts: "博客文章",
    form: {
      select: {
        category: {
          placeholder: "请选择分类",
        },
      },
    },
    fields: {
      id: "ID",
      title: "标题",
      category: "分类",
      status: {
        title: "状态",
        published: "已发布",
        draft: "草稿",
        rejected: "已拒绝",
      },
      content: "内容",
      createdAt: "创建时间",
    },
    titles: {
      create: "创建文章",
      edit: "编辑文章",
      list: "文章列表",
      show: "查看文章",
    },
  },
  categories: {
    categories: "分类",
    fields: {
      id: "ID",
      title: "标题",
      createdAt: "创建时间",
    },
    titles: {
      create: "创建分类",
      edit: "编辑分类",
      list: "分类列表",
      show: "查看分类",
    },
  },
  home: {
    title: "欢迎使用 Killerqueen",
    description: "开始您的游戏之旅",
  },
  lobby: {
    title: "游戏大厅",
    createRoom: "创建房间",
    joinRoom: "加入房间",
    roomList: "房间列表",
  },
  room: {
    waiting: "等待玩家加入...",
    ready: "准备",
    start: "开始游戏",
    players: "玩家",
    spectators: "观战者",
  },
  table: {
    actions: "操作",
  },
  fields: {
    email: "邮箱",
    username: "用户名",
    password: "密码",
  },
  validation: {
    required: "{field}是必填项",
    email: "请输入有效的邮箱地址",
    min: "{field}至少需要 {min} 个字符",
    max: "{field}最多 {max} 个字符",
  },
  resource: {
    profile: "资料",
  },
};

// Export the type for structure checking (not literal values)
export type Translations = typeof zhCN;
