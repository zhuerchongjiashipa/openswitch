import { useEffect, useState } from 'react';

export type Lang = 'en' | 'zh';

export interface Strings {
  searchPlaceholder: string;
  searchKbd: string;
  addCredential: string;
  workspaceSwitch: string;
  newEnvironment: string;
  newEnvDialogTitle: string;
  newEnvDialogSubtitle: string;
  addCredentialDialogTitle: string;
  addCredentialDialogSubtitle: string;
  toolsBound: (bound: number, total: number) => string;
  poolCount: (n: number) => string;
  poolLabel: string;
  active: string;
  unbound: string;
  noCredential: string;
  addedOn: (date: string) => string;
  addTool: (toolName: string) => string;
  cliPreviewTitle: string;
  cliPreviewHide: string;
  cliPreviewShow: string;
  cliPreviewSwitchingTo: (name: string) => string;
  cliPreviewUnboundLine: (cli: string) => string;
  escToCancel: string;
  cancel: string;
  create: string;
  addToPool: string;
  fieldName: string;
  fieldDescription: string;
  fieldDescriptionHint: string;
  fieldIcon: string;
  fieldColor: string;
  fieldColorHint: string;
  fieldStartingBindings: string;
  fieldStartingBindingsHint: string;
  bindingInherit: string;
  bindingInheritHint: string;
  bindingBlank: string;
  bindingBlankHint: string;
  bindingClone: string;
  bindingCloneHint: string;
  sourceEnvironment: string;
  sourceEnvironmentHint: (n: number) => string;
  toolsLabel: (n: number) => string;
  switchAfterCreating: string;
  switchAfterCreatingHint: string;
  fieldTool: string;
  fieldAlias: string;
  fieldAliasHint: string;
  noteSnapshot: string;
  bindImmediately: string;
  bindImmediatelyHint: string;
  credInputLabel: string;
  credInputHint: string;
}

const EN: Strings = {
  searchPlaceholder: 'Search credentials or tools',
  searchKbd: '⌘K',
  addCredential: 'Add credential',
  workspaceSwitch: 'Switch environment',
  newEnvironment: 'New environment…',
  newEnvDialogTitle: 'New environment',
  newEnvDialogSubtitle:
    'An environment is a named bundle of credential bindings you can flip to as a unit.',
  addCredentialDialogTitle: 'Add credential to pool',
  addCredentialDialogSubtitle:
    'Credentials live in a shared pool. Environments point at them by alias — rotate the secret here and every env follows.',
  toolsBound: (bound, total) => `${bound}/${total} tools bound`,
  poolCount: (n) => `${n} credentials in pool`,
  poolLabel: 'Pool',
  active: 'Active',
  unbound: 'Unbound',
  noCredential: 'no credential',
  addedOn: (date) => `added ${date}`,
  addTool: (toolName) => `+ add ${toolName}`,
  cliPreviewTitle: 'CLI preview — commands that the switch maps to',
  cliPreviewHide: 'hide',
  cliPreviewShow: 'show',
  cliPreviewSwitchingTo: (name) => `# Switching to ${name}`,
  cliPreviewUnboundLine: (cli) => `${cli} — unbound`,
  escToCancel: 'esc to cancel',
  cancel: 'Cancel',
  create: 'Create environment',
  addToPool: 'Add to pool',
  fieldName: 'Name',
  fieldDescription: 'Description',
  fieldDescriptionHint: 'Optional · one short line',
  fieldIcon: 'Icon',
  fieldColor: 'Color',
  fieldColorHint: 'Shown in the switcher and header',
  fieldStartingBindings: 'Starting bindings',
  fieldStartingBindingsHint: 'You can change any binding later',
  bindingInherit: 'Inherit',
  bindingInheritHint: 'Keep current active creds per tool',
  bindingBlank: 'Blank',
  bindingBlankHint: 'All tools unbound',
  bindingClone: 'Copy from…',
  bindingCloneHint: 'Duplicate another environment',
  sourceEnvironment: 'Source environment',
  sourceEnvironmentHint: (n) => `All ${n} tool bindings are copied`,
  toolsLabel: (n) => `${n} tools`,
  switchAfterCreating: 'Switch to this environment after creating',
  switchAfterCreatingHint: 'Activates each inherited binding immediately',
  fieldTool: 'Tool',
  fieldAlias: 'Alias',
  fieldAliasHint: 'How it appears in the pool',
  noteSnapshot:
    "Snapshots the live config on disk under this alias — we don't prompt for tokens.",
  bindImmediately: 'Bind immediately to…',
  bindImmediatelyHint: 'Optional · activates this credential in each chosen env',
  credInputLabel: 'Source',
  credInputHint: 'Your current config files are copied into the pool folder.',
};

const ZH: Strings = {
  searchPlaceholder: '搜索凭据或工具',
  searchKbd: '⌘K',
  addCredential: '添加凭据',
  workspaceSwitch: '切换环境',
  newEnvironment: '新建环境…',
  newEnvDialogTitle: '新建环境',
  newEnvDialogSubtitle:
    '环境是一组命名的凭据绑定，可以作为一个整体一键切换。',
  addCredentialDialogTitle: '向池中添加凭据',
  addCredentialDialogSubtitle:
    '凭据保存在共享池里。环境通过别名引用它们 —— 在这里轮换密钥，所有环境自动跟进。',
  toolsBound: (bound, total) => `已绑定 ${bound}/${total} 个工具`,
  poolCount: (n) => `池中共 ${n} 个凭据`,
  poolLabel: '凭据池',
  active: '当前',
  unbound: '未绑定',
  noCredential: '尚无凭据',
  addedOn: (date) => `添加于 ${date}`,
  addTool: (toolName) => `+ 添加 ${toolName}`,
  cliPreviewTitle: 'CLI 预览 —— 此次切换将执行的命令',
  cliPreviewHide: '收起',
  cliPreviewShow: '展开',
  cliPreviewSwitchingTo: (name) => `# 正在切换到 ${name}`,
  cliPreviewUnboundLine: (cli) => `${cli} —— 未绑定`,
  escToCancel: '按 esc 取消',
  cancel: '取消',
  create: '创建环境',
  addToPool: '加入池中',
  fieldName: '名称',
  fieldDescription: '描述',
  fieldDescriptionHint: '可选 · 简短一行',
  fieldIcon: '图标',
  fieldColor: '颜色',
  fieldColorHint: '显示在切换器和标题中',
  fieldStartingBindings: '初始绑定',
  fieldStartingBindingsHint: '之后仍可逐项修改',
  bindingInherit: '继承',
  bindingInheritHint: '沿用当前每个工具的激活凭据',
  bindingBlank: '空白',
  bindingBlankHint: '所有工具均未绑定',
  bindingClone: '复制自…',
  bindingCloneHint: '从另一个环境复制绑定',
  sourceEnvironment: '源环境',
  sourceEnvironmentHint: (n) => `将复制 ${n} 个工具绑定`,
  toolsLabel: (n) => `${n} 个工具`,
  switchAfterCreating: '创建后立即切换到此环境',
  switchAfterCreatingHint: '立即激活每一条继承来的绑定',
  fieldTool: '工具',
  fieldAlias: '别名',
  fieldAliasHint: '在池中如何显示',
  noteSnapshot:
    '将磁盘上的当前配置以此别名快照入池 —— 不会提示输入密钥。',
  bindImmediately: '立即绑定到…',
  bindImmediatelyHint: '可选 · 在选中的环境中立即激活此凭据',
  credInputLabel: '来源',
  credInputHint: '当前的配置文件会被复制到池目录中。',
};

const DICT: Record<Lang, Strings> = { en: EN, zh: ZH };

const STORAGE_KEY = 'openswitch.lang';

function readInitial(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  const nav = window.navigator.language.toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

let current: Lang = readInitial();
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  current = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((l) => l(next));
}

export function useLang(): { lang: Lang; t: Strings; setLang: (l: Lang) => void } {
  const [lang, setLocal] = useState<Lang>(current);
  useEffect(() => {
    const listener = (l: Lang) => setLocal(l);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { lang, t: DICT[lang], setLang };
}
