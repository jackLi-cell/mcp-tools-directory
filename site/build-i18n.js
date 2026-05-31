/**
 * Multi-language site builder
 * Creates /zh/ and /en/ directories from existing Chinese HTML files
 */
const fs = require('fs');
const path = require('path');

const SITE_DIR = __dirname;
const BASE_URL = normalizeSiteUrl(process.env.SITE_URL, 'https://mcp.jtlcook.com');
const SITEMAP_HTML_LIMIT = Number(process.env.SITEMAP_HTML_LIMIT || 49);
const BAIDU_ANALYTICS_ID = '97bd4d3caf25bef78d47870fa702abdd';

function normalizeSiteUrl(value, fallback) {
  const raw = String(value || fallback || '').trim().replace(/\/+$/, '');
  return raw.replace(/^http:\/\//i, 'https://');
}

function baiduAnalyticsScript() {
  return `<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?${BAIDU_ANALYTICS_ID}";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>`;
}

// Translation dictionary for common UI text
const translations = {
  // Full page titles (must come before partial matches)
  'AI Agent 与 MCP Server 工具目录 - 配置教程、权限说明与常见报错': 'AI Agent & MCP Server Tools Directory - Setup Guides, Permissions & Common Errors',
  '配置教程、权限说明与常见报错': 'Setup Guides, Permissions & Common Errors',
  // Nav
  'AI Agent 与 MCP Server 工具目录': 'AI Agent & MCP Server Tools Directory',
  '资料库': 'Directory',
  '教程': 'Guides',
  '配置生成器': 'Config Builder',
  '关于': 'About',
  // Footer
  '关于本站': 'About',
  '联系我们': 'Contact',
  '隐私政策': 'Privacy Policy',
  '免责声明': 'Disclaimer',
  '本站工具信息来自官方文档和公开仓库，使用前请以官方文档为准。第三方 MCP Server 由第三方维护，本站不保证安全性和可用性。': 'Tool information on this site comes from official documentation and public repositories. Please refer to official docs before use. Third-party MCP Servers are maintained by third parties; we do not guarantee their security or availability.',
  '联系邮箱：1055567003@qq.com': 'Contact email: 1055567003@qq.com',
  // Breadcrumb
  '首页': 'Home',
  '指南': 'Guides',
  // Homepage
  '按客户端、使用场景、安装方式和权限范围筛选 MCP Server 与 Agent 工具，查看配置步骤、常见错误和安全注意事项。': 'Filter MCP Servers and Agent tools by client, use case, installation method, and permission scope. View configuration steps, common errors, and security notes.',
  'MCP Server': 'MCP Server',
  '使用场景': 'Use Cases',
  '主流客户端': 'Clients',
  '搜索工具名称、场景或关键词...': 'Search tools, scenarios, or keywords...',
  '搜索工具': 'Search tools',
  '新手入口': 'Getting Started',
  '按场景浏览': 'Browse by Category',
  '低风险入门推荐': 'Low-Risk Starter Recommendations',
  '以下工具权限范围小、不需要 API Key 或只进行只读操作，适合新手第一次体验 MCP。安装后即可在对话中使用，无需额外配置。': 'These tools have minimal permissions, require no API Key, or perform read-only operations. Ideal for first-time MCP users. Ready to use after installation with no extra configuration.',
  '配置工具': 'Configuration Tools',
  '最近核验': 'Recently Verified',
  '以下工具最近完成了信息核验，配置和版本信息已确认有效。': 'The following tools have been recently verified. Their configuration and version information has been confirmed valid.',
  '常见问题': 'FAQ',
  // Cards
  'Claude Desktop 配置': 'Claude Desktop Setup',
  '从零开始配置你的第一个 MCP Server': 'Configure your first MCP Server from scratch',
  'Cursor 配置': 'Cursor Setup',
  '在 Cursor 编辑器中接入 MCP': 'Connect MCP in the Cursor editor',
  '安全检查清单': 'Security Checklist',
  '接入前必须确认的权限和风险': 'Permissions and risks to verify before connecting',
  '常见报错排查': 'Common Error Troubleshooting',
  '连接失败、命令找不到怎么办': 'What to do when connection fails or commands are not found',
  // Categories
  '文件与本地系统': 'File & Local System',
  '文件读写、目录检索、文档处理，重点提示权限范围': 'File read/write, directory search, document processing, with permission scope highlights',
  'Git 与开发工作流': 'Git & Dev Workflow',
  'Git、GitHub、代码搜索、PR 辅助、Issue 管理': 'Git, GitHub, code search, PR assistance, Issue management',
  '数据库与数据查询': 'Database & Data Query',
  'SQLite、PostgreSQL、MySQL、表格数据，重点提示只读与写入权限': 'SQLite, PostgreSQL, MySQL, tabular data, with read/write permission highlights',
  '浏览器与网页自动化': 'Browser & Web Automation',
  '页面读取、测试、截图、自动操作，必须提示账号和隐私风险': 'Page reading, testing, screenshots, automation, with account and privacy risk warnings',
  '搜索与知识库': 'Search & Knowledge Base',
  'Web 搜索、文档库、向量库、团队知识库': 'Web search, document libraries, vector stores, team knowledge bases',
  '设计与产品协作': 'Design & Product Collaboration',
  'Figma、Linear、Notion、文档协作': 'Figma, Linear, Notion, document collaboration',
  '部署与运维': 'Deploy & Operations',
  'Docker、Cloudflare、Vercel、日志与监控类工具': 'Docker, Cloudflare, Vercel, logging and monitoring tools',
  '个工具': ' tools',
  // Table headers
  '<th>工具</th>': '<th>Tool</th>',
  '<th>场景</th>': '<th>Category</th>',
  '<th>风险</th>': '<th>Risk</th>',
  '<th>说明</th>': '<th>Description</th>',
  '<th>核验日期</th>': '<th>Verified Date</th>',
  '<th>状态</th>': '<th>Status</th>',
  '<td>已核验</td>': '<td>Verified</td>',
  // Risk badges
  '低风险': 'Low Risk',
  '中风险': 'Medium Risk',
  '高风险': 'High Risk',
  // Config builder card
  '配置片段生成器': 'Config Snippet Builder',
  '选择 MCP Server，自动生成 JSON 配置片段，支持多工具组合导出': 'Select MCP Servers to auto-generate JSON config snippets, with multi-tool export support',
  '完整资料库': 'Full Directory',
  '查看全部 56 个工具，按场景、风险和 API Key 需求筛选': 'View all 56 tools, filter by category, risk level, and API Key requirements',
  // FAQ
  'MCP Server 和普通插件有什么区别？': 'What is the difference between MCP Server and regular plugins?',
  'MCP（Model Context Protocol）是一个标准化协议，一个 Server 可以被 Claude Desktop、Cursor、VS Code 等多个客户端使用。普通插件通常只适用于特定工具，且接口不统一。MCP 的优势是"写一次，到处用"。': 'MCP (Model Context Protocol) is a standardized protocol. One Server can be used by multiple clients like Claude Desktop, Cursor, and VS Code. Regular plugins typically only work with specific tools and have inconsistent interfaces. MCP\'s advantage is "write once, use everywhere."',
  '需要编程基础才能使用 MCP 吗？': 'Do I need programming skills to use MCP?',
  '基础使用只需要编辑 JSON 配置文件，不需要写代码。你需要了解如何打开终端、找到配置文件路径、设置环境变量。本站的客户端教程会一步步引导你完成。': 'Basic usage only requires editing JSON configuration files, no coding needed. You need to know how to open a terminal, find config file paths, and set environment variables. Our client tutorials will guide you step by step.',
  'MCP Server 安全吗？': 'Is MCP Server safe?',
  '取决于具体工具的权限范围。文件系统类工具可以读写你的文件，数据库类可以查询数据，浏览器类可以访问网页。本站为每个工具标注了风险等级和权限说明，建议从低风险工具开始体验。': 'It depends on the specific tool\'s permission scope. File system tools can read/write your files, database tools can query data, and browser tools can access web pages. This site labels each tool with risk levels and permission descriptions. We recommend starting with low-risk tools.',
  '新手应该先装哪个 MCP？': 'Which MCP should beginners install first?',
  '本站的工具信息多久更新一次？': 'How often is tool information updated?',
  '每个工具条目标注了最近核验日期。我们会定期检查官方仓库和文档变化。超过 60 天未核验的工具会标记为"待复核"。如果你发现信息过期，欢迎通过联系页面反馈。': 'Each tool entry shows its last verification date. We regularly check official repositories and documentation for changes. Tools not verified for over 60 days are marked as "pending review." If you find outdated information, please let us know via the contact page.',
  // Server detail pages
  '安装方式': 'Installation',
  '风险等级': 'Risk Level',
  '客户端': 'Clients',
  '个支持': ' supported',
  '支持客户端': 'Supported Clients',
  '安装命令': 'Installation Command',
  '配置示例': 'Configuration Example',
  '权限范围与安全提示': 'Permission Scope & Security Notes',
  '常见报错': 'Common Errors',
  '来源': 'Sources',
  '相关工具': 'Related Tools',
  '复制': 'Copy',
  '配置说明': 'Configuration Guide',
  '安装命令、权限范围与常见报错': 'Installation commands, permission scope, and common errors',
  // Guide pages
  'MCP Server 是什么': 'What is MCP Server',
  '核心概念': 'Core Concepts',
  '工作原理': 'How It Works',
  'MCP Server 能做什么': 'What Can MCP Server Do',
  '注意事项': 'Important Notes',
  '相关链接': 'Related Links',
  // Misc
  '需要': 'Required',
  '不需要': 'Not Required',
  '风险评分': 'Risk Score',
  '最近核验': 'Recently Verified',
  '待复核': 'Pending Review',
  '新手推荐指南': 'Beginner Recommendations Guide',
  // Server descriptions
  '基于知识图谱的持久化记忆系统，支持实体和关系的存储与查询': 'A persistent memory system based on knowledge graphs, supporting entity and relationship storage and querying',
  '获取网页内容并转换为 Markdown 格式，方便 AI 阅读': 'Fetches web content and converts it to Markdown format for easy AI reading',
  'Git 仓库操作，支持读取提交历史、diff、分支和文件内容': 'Git repository operations, supporting commit history, diff, branches, and file content reading',
  '结构化思考工具，帮助 AI 进行分步推理和问题分解': 'Structured thinking tool that helps AI perform step-by-step reasoning and problem decomposition',
  'MCP 协议测试和参考实现，包含所有 MCP 功能的示例': 'MCP protocol testing and reference implementation, containing examples of all MCP features',
  'Sentry 错误监控集成，支持查看 Issue、错误详情和项目状态': 'Sentry error monitoring integration, supporting Issue viewing, error details, and project status',
  'Exa AI 搜索引擎集成，支持语义搜索和内容获取': 'Exa AI search engine integration, supporting semantic search and content retrieval',
  'Tavily AI 搜索引擎，专为 AI Agent 优化的搜索 API': 'Tavily AI search engine, a search API optimized for AI Agents',
  'Figma 设计文件读取，支持获取设计稿信息、组件和样式': 'Figma design file reading, supporting design draft info, components, and styles',
  '时间和时区工具，支持获取当前时间和时区转换': 'Time and timezone tool, supporting current time retrieval and timezone conversion',
  'Perplexity AI 搜索集成，返回带引用来源的 AI 综合搜索结果': 'Perplexity AI search integration, returning AI-synthesized search results with cited sources',
  '为 AI 编程助手提供最新的库文档和代码示例，避免使用过时 API': 'Provides up-to-date library documentation and code examples for AI coding assistants, avoiding outdated APIs',
  'ArXiv 学术论文搜索，支持按关键词、作者和分类检索论文摘要': 'ArXiv academic paper search, supporting keyword, author, and category-based abstract retrieval',
  'YouTube 视频字幕下载，支持获取视频的完整文字记录': 'YouTube video subtitle download, supporting full transcript retrieval',
  'GitHub API 集成，支持仓库管理、文件操作、Issue、PR、分支和搜索': 'GitHub API integration, supporting repository management, file operations, Issues, PRs, branches, and search',
  // Server detail page titles
  '配置说明 - 安装命令、权限范围与常见报错': 'Configuration Guide - Installation, Permissions & Common Errors',
  '配置与使用说明': 'Configuration & Usage Guide',
  '查看': 'View',
  '的 MCP Server 用途、支持客户端、安装命令、配置示例、权限范围和最近核验日期。': ' MCP Server usage, supported clients, installation commands, configuration examples, permission scope, and last verification date.',
  '按客户端、使用场景、安装方式和权限范围筛选 AI Agent 工具与 MCP Server，查看配置步骤、常见错误和安全注意事项。': 'Filter AI Agent tools and MCP Servers by client, use case, installation method, and permission scope. View configuration steps, common errors, and security notes.',
  // Guide specific
  'Model Context Protocol 的基本概念、与普通插件的区别和工作原理': 'Basic concepts of Model Context Protocol, differences from regular plugins, and how it works',
  'MCP Server 与普通插件的区别': 'Differences Between MCP Server and Regular Plugins',
  '对比项': 'Comparison',
  '普通插件': 'Regular Plugins',
  '协议': 'Protocol',
  '标准化的 JSON-RPC 协议': 'Standardized JSON-RPC protocol',
  '各平台私有 API': 'Platform-specific private APIs',
  '复用性': 'Reusability',
  '一个 Server 可被多个客户端使用': 'One Server can be used by multiple clients',
  '通常只适用于特定平台': 'Usually only works with specific platforms',
  '运行方式': 'Runtime',
  '独立进程，通过 stdio 或 HTTP 通信': 'Independent process, communicating via stdio or HTTP',
  '通常在宿主进程内运行': 'Usually runs within the host process',
  '开发语言': 'Language',
  '任意语言（Node.js、Python 等）': 'Any language (Node.js, Python, etc.)',
  '受限于平台 SDK': 'Limited to platform SDK',
  '安全边界': 'Security Boundary',
  '进程隔离，权限可控': 'Process isolation, controllable permissions',
  '通常共享宿主权限': 'Usually shares host permissions',
  // About page
  '关于本站 - AI Agent 与 MCP Server 工具目录': 'About - AI Agent & MCP Server Tools Directory',
  '关于本站': 'About This Site',
  '本站是面向中文用户的 AI Agent 与 MCP Server 工具目录，帮助开发者按使用场景、客户端、安装方式和权限范围筛选工具，并提供配置步骤、常见错误排查和安全检查清单。': 'This site is an AI Agent and MCP Server tools directory that helps developers filter tools by use case, client, installation method, and permission scope, with configuration steps, error troubleshooting, and security checklists.',
  '内容来源': 'Content Sources',
  '工具信息来自官方文档、GitHub 仓库、npm/PyPI 包页面和客户端官方文档。每个工具条目标注最近核验日期，超过 60 天未核验的标记为"待复核"。': 'Tool information comes from official documentation, GitHub repositories, npm/PyPI package pages, and client official docs. Each tool entry shows its last verification date; tools not verified for over 60 days are marked as "pending review."',
  '本站不做什么': 'What This Site Does NOT Do',
  '不托管用户密钥或配置文件': 'Does not host user keys or configuration files',
  '不代理用户调用任何 API': 'Does not proxy user API calls',
  '不提供远程执行服务': 'Does not provide remote execution services',
  '不保证第三方工具的安全性和可用性': 'Does not guarantee the security or availability of third-party tools',
  '不提供绕过平台限制或攻击性自动化教程': 'Does not provide tutorials for bypassing platform restrictions or offensive automation',
  '联系': 'Contact',
  '如发现工具信息过期、配置错误或有安全问题，请通过': 'If you find outdated tool information, configuration errors, or security issues, please report via',
  '联系页面': 'the contact page',
  '反馈。': '.',
  // Page titles
  '隐私政策 - AI Agent 与 MCP Server 工具目录': 'Privacy Policy - AI Agent & MCP Server Tools Directory',
  '访问统计': 'Analytics',
  '本站已接入百度统计（Baidu Analytics），用于了解汇总访问量、访问来源和页面使用情况。统计服务可能使用 Cookie 或类似技术生成匿名访问指标，不用于识别个人身份。': 'This site uses Baidu Analytics for aggregated visit counts, traffic sources, and page usage. The analytics service may use cookies or similar technology to generate anonymous visit metrics and does not identify individuals.',
  '本站核心功能不依赖 Cookie。百度统计等访问统计服务可能使用 Cookie 或类似技术用于匿名、汇总的访问统计。': 'Core site features do not depend on cookies. Baidu Analytics and similar analytics services may use cookies or similar technology for anonymous, aggregated visit statistics.',
  '联系我们 - AI Agent 与 MCP Server 工具目录': 'Contact Us - AI Agent & MCP Server Tools Directory',
  '免责声明 - AI Agent 与 MCP Server 工具目录': 'Disclaimer - AI Agent & MCP Server Tools Directory',
  'MCP Server 是什么 - AI Agent 与 MCP Server 工具目录': 'What is MCP Server - AI Agent & MCP Server Tools Directory',
  // Category counts
  '6 个工具': '6 tools',
  '2 个工具': '2 tools',
  '10 个工具': '10 tools',
  '8 个工具': '8 tools',
  '16 个工具': '16 tools',
  // Server detail page titles
  '配置说明 - 安装命令、权限范围与常见报错': 'Configuration Guide - Installation, Permissions & Common Errors',
  '配置与使用说明': 'Configuration & Usage Guide',
  // Guide content
  'MCP 定义了三个角色：': 'MCP defines three roles:',
  '用户直接交互的应用程序，如 Claude Desktop、Cursor 等。': 'The application that users interact with directly, such as Claude Desktop, Cursor, etc.',
  'Host 内部的 MCP 协议客户端，负责与 Server 通信。': 'The MCP protocol client inside the Host, responsible for communicating with the Server.',
  '提供具体工具能力的程序，如文件系统访问、数据库查询、API 调用等。': 'Programs that provide specific tool capabilities, such as file system access, database queries, API calls, etc.',
  '一个 Host 可以同时连接多个 MCP Server，每个 Server 提供不同的工具集。': 'A Host can connect to multiple MCP Servers simultaneously, each providing different tool sets.',
  'MCP 的通信流程如下：': 'The MCP communication flow is as follows:',
  'Host 启动时，根据配置文件启动 MCP Server 子进程。': 'When the Host starts, it launches MCP Server child processes based on the configuration file.',
  'Client 通过 stdio（标准输入输出）与 Server 建立 JSON-RPC 连接。': 'The Client establishes a JSON-RPC connection with the Server via stdio (standard input/output).',
  'Server 向 Client 声明自己提供的工具列表（tools）和资源（resources）。': 'The Server declares its available tools and resources to the Client.',
  '用户与 AI 对话时，AI 根据需要调用 Server 提供的工具。': 'During user-AI conversations, the AI calls Server-provided tools as needed.',
  'Server 执行操作并返回结果，AI 将结果整合到回复中。': 'The Server executes operations and returns results, which the AI integrates into its response.',
  '读写本地文件系统': 'Read/write local file system',
  '执行数据库查询': 'Execute database queries',
  '调用第三方 API（GitHub、Slack、Notion 等）': 'Call third-party APIs (GitHub, Slack, Notion, etc.)',
  '运行 Shell 命令': 'Run Shell commands',
  '搜索和抓取网页内容': 'Search and scrape web content',
  '管理日历和邮件': 'Manage calendars and emails',
  'MCP Server 以本地进程运行，拥有你授予的系统权限，接入前务必确认权限范围。': 'MCP Server runs as a local process with the system permissions you grant. Always verify the permission scope before connecting.',
  '不同 Server 的风险等级不同，文件只读类风险低，能执行命令或访问网络的风险高。': 'Different Servers have different risk levels. Read-only file tools are low risk, while those that can execute commands or access the network are higher risk.',
  'MCP 协议仍在快速迭代中，配置格式可能随客户端版本变化。': 'The MCP protocol is still rapidly evolving. Configuration formats may change with client versions.',
  'MCP 是 Anthropic 专有的吗？': 'Is MCP proprietary to Anthropic?',
  'MCP 是开放协议，规范和 SDK 均开源。任何 AI 客户端都可以实现 MCP 支持，目前 Claude Desktop、Cursor、Windsurf 等已支持。': 'MCP is an open protocol with open-source specifications and SDKs. Any AI client can implement MCP support. Currently Claude Desktop, Cursor, Windsurf, and others support it.',
  '使用 MCP 需要编程基础吗？': 'Do I need programming skills to use MCP?',
  '基础使用只需编辑 JSON 配置文件，不需要写代码。但理解命令行操作和环境变量概念会有帮助。': 'Basic usage only requires editing JSON configuration files, no coding needed. However, understanding command-line operations and environment variables is helpful.',
  'MCP Server 会自动更新吗？': 'Does MCP Server auto-update?',
  '不会。MCP Server 通过 npx 或 uvx 运行时会拉取最新版本，但本地安装的需要手动更新。建议定期检查官方仓库的更新日志。': 'No. MCP Servers run via npx or uvx will pull the latest version, but locally installed ones need manual updates. We recommend regularly checking official repository changelogs.',
  '返回执行结果': 'Returns execution results',
  // Meta items
  '场景：': 'Category: ',
  '核验：': 'Verified: ',
  '状态：已核验': 'Status: Verified',
  '状态：待复核': 'Status: Pending Review',
};

// Extended translations for server detail pages
const serverTranslations = {
  '需要设置环境变量': 'Environment variable required',
  '不要把这些值提交到公开仓库。': 'Do not commit these values to public repositories.',
  '需要 GitHub Token，可操作你有权限的仓库，建议使用最小权限 Token': 'Requires a GitHub Token. Can operate on repositories you have access to. Use a minimal-permission Token.',
  '检查 Token 是否过期或权限不足': 'Check if the Token has expired or has insufficient permissions',
  '确认 Token 有该仓库的访问权限': 'Confirm the Token has access to the repository',
  'GitHub API 有速率限制，等待后重试': 'GitHub API has rate limits, wait and retry',
  '找不到仓库': 'Repository not found',
  '官方文档 / 仓库': 'Official Documentation / Repository',
  '客户端版本和配置格式可能变化，使用前请以官方文档为准。': 'Client versions and configuration formats may change. Please refer to official documentation before use.',
};

Object.assign(translations, serverTranslations);

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAllHtmlFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip zh/, en/, assets/, data/ directories
      if (['zh', 'en', 'assets', 'data'].includes(item)) continue;
      results = results.concat(getAllHtmlFiles(fullPath, baseDir));
    } else if (item.endsWith('.html')) {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

// Calculate relative path from a file to the language root
function getRelativePrefix(filePath) {
  const depth = filePath.split('/').length - 1;
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

// Language switcher HTML
function getLangSwitcher(lang, filePath) {
  const otherLang = lang === 'zh' ? 'en' : 'zh';
  const otherLabel = lang === 'zh' ? 'English' : '中文';
  // Path from current file to the other language version
  const depth = filePath.split('/').length; // includes the file itself
  const prefix = '../'.repeat(depth); // go up to site root from zh/xxx or en/xxx
  const otherPath = prefix + otherLang + '/' + filePath;

  return `<div class="lang-switch"><a href="${otherPath}" class="lang-btn">${otherLabel}</a></div>`;
}

// Build hreflang tags
function getHreflangTags(filePath) {
  let slug = filePath.replace(/\.html$/, '');
  if (slug === 'index') slug = '';
  else slug = slug.replace(/\/index$/, '/');
  const zhUrl = `${BASE_URL}/zh/${slug}`;
  const enUrl = `${BASE_URL}/en/${slug}`;
  return `  <link rel="alternate" hreflang="zh" href="${zhUrl}">\n  <link rel="alternate" hreflang="en" href="${enUrl}">\n  <link rel="alternate" hreflang="x-default" href="${enUrl}">\n`;
}

// Build canonical tag
function getCanonical(lang, filePath) {
  let slug = filePath.replace(/\.html$/, '');
  if (slug === 'index') slug = '';
  else slug = slug.replace(/\/index$/, '/');
  const url = `${BASE_URL}/${lang}/${slug}`;
  return `<link rel="canonical" href="${url}">`;
}

// Fix internal links for language directory
function fixLinks(html, lang, filePath) {
  const prefix = getRelativePrefix(filePath);
  // assetPrefix: from the file's position inside zh/ or en/, go up to site root
  // For zh/index.html (depth 0 within zh/), we need ../assets/
  // For zh/servers/github.html (depth 1 within zh/), we need ../../assets/
  const depth = filePath.split('/').length - 1;
  const assetPrefix = '../' + (depth > 0 ? '../'.repeat(depth) : '');

  // Fix absolute links like /servers/index.html -> relative within lang dir
  html = html.replace(/href="\/([^"]+)"/g, (match, p1) => {
    return `href="${prefix}${p1}"`;
  });

  // Fix relative links to assets (../assets, ./assets)
  // Assets stay at root level, so from zh/xxx we need to go up appropriately
  html = html.replace(/(href|src)="(\.\.\/)*assets\//g, (match, attr) => {
    return `${attr}="${assetPrefix}assets/`;
  });
  html = html.replace(/(href|src)="\.\/assets\//g, (match, attr) => {
    return `${attr}="${assetPrefix}assets/`;
  });

  // Fix favicon
  html = html.replace(/href="(\.\.\/)*favicon\.svg"/g, () => {
    return `href="${assetPrefix}favicon.svg"`;
  });
  html = html.replace(/href="\.\/favicon\.svg"/g, () => {
    return `href="${assetPrefix}favicon.svg"`;
  });

  return html;
}

// Translate text content (for English version)
function translateHtml(html) {
  let result = html;

  // Sort translations by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

  for (const zhText of sortedKeys) {
    const enText = translations[zhText];
    // Use global replace but be careful with HTML entities
    result = result.split(zhText).join(enText);
  }

  return result;
}

// Process a single HTML file for a given language
function processHtml(html, lang, filePath) {
  let result = html;

  // 1. Set lang attribute
  result = result.replace(/<html lang="[^"]*">/, `<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">`);

  // 2. Replace canonical
  const canonicalRegex = /<link rel="canonical" href="[^"]*">/;
  result = result.replace(canonicalRegex, getCanonical(lang, filePath));

  // 3. Add hreflang tags after canonical (or after charset if no canonical)
  const hreflangHtml = getHreflangTags(filePath);
  if (result.includes('<link rel="canonical"')) {
    result = result.replace(/(<link rel="canonical" [^>]+>)/, `$1\n${hreflangHtml}`);
  } else {
    result = result.replace(/(<meta name="viewport"[^>]+>)/, `$1\n${hreflangHtml}`);
  }

  // 4. Fix links for the language directory
  result = fixLinks(result, lang, filePath);

  // 5. Add language switcher after nav opening
  const switcherHtml = getLangSwitcher(lang, filePath);
  result = result.replace(
    /(<nav class="nav">[\s\S]*?<\/nav>)/,
    (match) => match.replace('</nav>', `${switcherHtml}</nav>`)
  );

  // 6. Update OG URLs
  const ogUrlRegex = /<meta property="og:url" content="[^"]*">/;
  let ogSlug = filePath.replace(/\.html$/, '');
  if (ogSlug === 'index') ogSlug = '';
  else ogSlug = ogSlug.replace(/\/index$/, '/');
  const newOgUrl = `${BASE_URL}/${lang}/${ogSlug}`;
  result = result.replace(ogUrlRegex, `<meta property="og:url" content="${newOgUrl}">`);

  // 7. For English version, translate content
  if (lang === 'en') {
    result = translateHtml(result);
  }

  return result;
}

// ============================================================
// MAIN BUILD
// ============================================================

console.log('Starting multi-language build...');

// Get all HTML files - check if source files exist at root or in zh/
// If root directories (servers/, guides/, etc.) don't exist, use zh/ as source
let sourceDir = SITE_DIR;
if (!fs.existsSync(path.join(SITE_DIR, 'servers')) && fs.existsSync(path.join(SITE_DIR, 'zh', 'servers'))) {
  sourceDir = path.join(SITE_DIR, 'zh');
  console.log('Source files already moved to zh/, using zh/ as source...');
}

const htmlFiles = getAllHtmlFiles(sourceDir);
console.log(`Found ${htmlFiles.length} HTML files to process.`);

// Create zh/ and en/ directories
ensureDir(path.join(SITE_DIR, 'zh'));
ensureDir(path.join(SITE_DIR, 'en'));

// Process each file
for (const filePath of htmlFiles) {
  const srcPath = path.join(sourceDir, filePath);
  let html = fs.readFileSync(srcPath, 'utf-8');

  // If reading from zh/ (already processed), strip out old hreflang/lang-switch/canonical modifications
  if (sourceDir !== SITE_DIR) {
    // Remove old hreflang tags
    html = html.replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
    // Remove old lang-switch div
    html = html.replace(/<div class="lang-switch">.*?<\/div>/g, '');
    // Restore original lang attribute (fix double > from previous run)
    html = html.replace(/<html lang="[^"]*">+/, '<html lang="zh-CN">');
    // Restore canonical to original format
    html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://mcp.jtlcook.com/">');
    // Fix asset paths back to original (undo the previous ../assets -> ../../assets)
    html = html.replace(/(href|src)="\.\.\/assets\//g, '$1="./assets/');
    html = html.replace(/(href|src)="\.\.\/\.\.\/assets\//g, '$1="../assets/');
    html = html.replace(/href="\.\.\/favicon\.svg"/g, 'href="./favicon.svg"');
    html = html.replace(/href="\.\.\/\.\.\/favicon\.svg"/g, 'href="../favicon.svg"');
  }

  // Process for Chinese
  const zhHtml = processHtml(html, 'zh', filePath);
  const zhPath = path.join(SITE_DIR, 'zh', filePath);
  ensureDir(path.dirname(zhPath));
  fs.writeFileSync(zhPath, zhHtml, 'utf-8');

  // Process for English
  const enHtml = processHtml(html, 'en', filePath);
  const enPath = path.join(SITE_DIR, 'en', filePath);
  ensureDir(path.dirname(enPath));
  fs.writeFileSync(enPath, enHtml, 'utf-8');
}

console.log(`Processed ${htmlFiles.length} files for both zh/ and en/ directories.`);

// ============================================================
// CREATE ROOT index.html (language detection)
// ============================================================

const rootIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Agent & MCP Tools Directory</title>
<link rel="alternate" hreflang="zh" href="${BASE_URL}/zh/">
<link rel="alternate" hreflang="en" href="${BASE_URL}/en/">
<link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/">
${baiduAnalyticsScript()}
<script>
(function(){
  var saved = localStorage.getItem('lang');
  if(saved === 'en') { window.location.replace('./en/'); return; }
  if(saved === 'zh') { window.location.replace('./zh/'); return; }
  var lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if(lang.startsWith('zh')) { window.location.replace('./zh/'); }
  else { window.location.replace('./en/'); }
})();
</script>
</head>
<body>
<noscript>
<p><a href="./zh/">中文版</a> | <a href="./en/">English</a></p>
</noscript>
</body>
</html>`;

// We'll write this after removing old files

// ============================================================
// UPDATE SITEMAP
// ============================================================

function buildSitemap() {
  const sitemapFiles = selectSitemapHtmlFiles(htmlFiles);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // Root page
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += '    <lastmod>2026-05-26</lastmod>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += `    <xhtml:link rel="alternate" hreflang="zh" href="${BASE_URL}/zh/"/>\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/"/>\n`;
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/"/>\n`;
  xml += '  </url>\n';

  for (const filePath of sitemapFiles) {
    let slug = filePath.replace(/\.html$/, '');
    if (slug === 'index') slug = '';
    else slug = slug.replace(/\/index$/, '/');
    const zhUrl = `${BASE_URL}/zh/${slug}`;
    const enUrl = `${BASE_URL}/en/${slug}`;

    // Determine priority
    let priority = '0.7';
    if (filePath === 'index.html') priority = '0.9';
    else if (filePath.startsWith('servers/index')) priority = '0.8';
    else if (filePath.startsWith('clients/')) priority = '0.8';
    else if (filePath.startsWith('categories/')) priority = '0.6';
    else if (filePath.startsWith('pages/')) priority = '0.5';
    else if (filePath.startsWith('tools/')) priority = '0.5';

    // ZH entry
    xml += '  <url>\n';
    xml += `    <loc>${zhUrl}</loc>\n`;
    xml += '    <lastmod>2026-05-26</lastmod>\n';
    xml += `    <priority>${priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="zh" href="${zhUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>\n`;
    xml += '  </url>\n';

    // EN entry
    xml += '  <url>\n';
    xml += `    <loc>${enUrl}</loc>\n`;
    xml += '    <lastmod>2026-05-26</lastmod>\n';
    xml += `    <priority>${priority}</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="zh" href="${zhUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

function selectSitemapHtmlFiles(fileList) {
  const score = (filePath) => {
    if (filePath === 'index.html') return 0;
    if (/^servers\/index\.html$/.test(filePath)) return 1;
    if (/^clients\//.test(filePath)) return 2;
    if (/^guides\//.test(filePath)) return 3;
    if (/^categories\//.test(filePath)) return 4;
    if (/^tools\//.test(filePath)) return 5;
    if (/^pages\//.test(filePath)) return 6;
    if (/^servers\//.test(filePath)) return 8;
    return 20;
  };
  return [...fileList]
    .sort((a, b) => score(a) - score(b) || a.localeCompare(b))
    .slice(0, SITEMAP_HTML_LIMIT);
}

const sitemapXml = buildSitemap();

// ============================================================
// REMOVE OLD ROOT HTML FILES & WRITE NEW FILES
// ============================================================

// Remove old HTML files from root (keep assets, zh, en, data, favicon, robots, sitemap, this script)
const keepItems = ['assets', 'zh', 'en', 'data', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'build-i18n.js', 'index.html'];

const rootItems = fs.readdirSync(SITE_DIR);
for (const item of rootItems) {
  if (keepItems.includes(item)) continue;
  const fullPath = path.join(SITE_DIR, item);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    // Remove directories that are now in zh/ and en/
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed directory: ${item}/`);
  } else if (item.endsWith('.html') && item !== 'index.html') {
    fs.unlinkSync(fullPath);
    console.log(`Removed file: ${item}`);
  }
}

// Write new root index.html
fs.writeFileSync(path.join(SITE_DIR, 'index.html'), rootIndexHtml, 'utf-8');
console.log('Created root index.html (language detection page)');

// Write new sitemap.xml
fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log('Updated sitemap.xml with bilingual entries');

console.log('\nBuild complete!');
console.log(`- zh/ directory: ${htmlFiles.length} files`);
console.log(`- en/ directory: ${htmlFiles.length} files`);
console.log('- Root index.html: language detection page');
console.log('- sitemap.xml: updated with hreflang annotations');
