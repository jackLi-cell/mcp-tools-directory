#!/usr/bin/env node
/**
 * AI Agent 与 MCP 工具目录教程站 - 静态站生成脚本
 * 读取 data/ 下的 JSON 数据，生成 site/ 下的所有 HTML 页面
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const SITE_DIR = join(ROOT, 'site');

const SITE_NAME = 'AI Agent 与 MCP Server 工具目录';
const SITE_URL = normalizeSiteUrl(process.env.SITE_URL, 'https://mcp.jtlcook.com');
const CONTACT_EMAIL = '1055567003@qq.com';
const BAIDU_ANALYTICS_ID = '97bd4d3caf25bef78d47870fa702abdd';

function normalizeSiteUrl(value, fallback) {
  const raw = String(value || fallback || '').trim().replace(/\/+$/, '');
  return raw.replace(/^http:\/\//i, 'https://');
}

// --- Data Loading ---
const servers = JSON.parse(readFileSync(join(DATA_DIR, 'servers.json'), 'utf-8'));
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf-8'));
const clients = JSON.parse(readFileSync(join(DATA_DIR, 'clients.json'), 'utf-8'));
const guides = JSON.parse(readFileSync(join(DATA_DIR, 'guides.json'), 'utf-8'));

// --- Helpers ---
function cleanUrl(url) {
  // /xxx/index.html -> /xxx/
  url = url.replace(/\/index\.html$/, '/');
  // /xxx.html -> /xxx
  url = url.replace(/\.html$/, '');
  return url;
}

function getPrefix(canonical) {
  const parts = canonical.split('/').filter(Boolean);
  const depth = canonical.endsWith('/') ? parts.length : Math.max(0, parts.length - 1);
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

function relativize(html, prefix) {
  // Replace href="/" with href to index
  html = html.replace(/href="\/"/g, `href="${prefix}index.html"`);
  // Replace href="/#xxx" (root with hash) with href="${prefix}index.html#xxx"
  html = html.replace(/href="\/(#[^"]+)"/g, (match, hash) => `href="${prefix}index.html${hash}"`);
  // Replace href="/xxx/" (directory links) with href="${prefix}xxx/index.html"
  html = html.replace(/href="\/([^"]*\/)"/g, (match, path) => `href="${prefix}${path}index.html"`);
  // Replace href="/xxx" (file links) with href="${prefix}xxx"
  html = html.replace(/href="\/([^"]+)"/g, (match, path) => `href="${prefix}${path}"`);
  // Replace src="/xxx" with src="${prefix}xxx"
  html = html.replace(/src="\/([^"]+)"/g, (match, path) => `src="${prefix}${path}"`);
  return html;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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

function riskBadge(level) {
  const map = { low: '低风险', medium: '中风险', high: '高风险' };
  const cls = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
  return `<span class="badge ${cls[level] || ''}">${map[level] || level}</span>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// --- Layout Template ---
function layout(title, description, canonical, content, breadcrumb = '', jsonLd = null) {
  const prefix = getPrefix(canonical);
  const nav = `
    <nav class="nav">
      <div class="container nav-inner">
        <a href="${prefix}index.html" class="nav-brand">${SITE_NAME}</a>
        <div class="nav-links">
          <a href="/servers/index.html">资料库</a>
          <a href="/guides/what-is-mcp.html">教程</a>
          <a href="/tools/config-builder.html">配置生成器</a>
          <a href="${prefix}pages/about.html">关于</a>
        </div>
      </div>
    </nav>`;

  const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-links">
          <a href="${prefix}pages/about.html">关于本站</a>
          <a href="${prefix}pages/contact.html">联系我们</a>
          <a href="${prefix}pages/privacy.html">隐私政策</a>
          <a href="${prefix}pages/disclaimer.html">免责声明</a>
        </div>
        <p class="footer-note">本站工具信息来自官方文档和公开仓库，使用前请以官方文档为准。第三方 MCP Server 由第三方维护，本站不保证安全性和可用性。</p>
        <p class="footer-note">联系邮箱：${CONTACT_EMAIL}</p>
      </div>
    </footer>`;

  const processedContent = relativize(content, prefix);
  const processedBreadcrumb = relativize(breadcrumb, prefix);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${SITE_URL}${cleanUrl(canonical)}">
  <link rel="icon" href="${prefix}favicon.ico" sizes="any">
  <link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg">
  <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${SITE_URL}${cleanUrl(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  ${baiduAnalyticsScript()}
</head>
<body>
  ${nav}
  <main class="main container">
    ${processedBreadcrumb}
    ${processedContent}
  </main>
  ${footer}
  <script src="${prefix}assets/app.js" defer></script>
</body>
</html>`;
}

function breadcrumb(items) {
  const parts = items.map((item, i) => {
    if (i === items.length - 1) return `<span>${escapeHtml(item.name)}</span>`;
    return `<a href="${item.href}">${escapeHtml(item.name)}</a>`;
  });
  return `<nav class="breadcrumb">${parts.join(' / ')}</nav>`;
}

// --- Page Generators ---

function buildIndex() {
  const lowRisk = servers.filter(s => s.riskLevel === 'low');
  const recentlyChecked = [...servers].sort((a, b) => b.lastCheckedAt.localeCompare(a.lastCheckedAt)).slice(0, 5);
  const content = `
    <section class="hero">
      <h1>AI Agent 与 MCP Server 工具目录</h1>
      <p class="hero-sub">按客户端、使用场景、安装方式和权限范围筛选 MCP Server 与 Agent 工具，查看配置步骤、常见错误和安全注意事项。</p>
      <div class="hero-stats">
        <div class="hero-stat"><strong>${servers.length}</strong>MCP Server</div>
        <div class="hero-stat"><strong>${categories.length}</strong>使用场景</div>
        <div class="hero-stat"><strong>${clients.length}</strong>主流客户端</div>
      </div>
      <div class="search-box">
        <input type="text" id="search-input" placeholder="搜索工具名称、场景或关键词..." aria-label="搜索工具">
      </div>
    </section>

    <section class="section">
      <h2>新手入口</h2>
      <div class="card-grid card-beginner">
        <a href="/clients/claude-desktop.html" class="card">
          <h3>🚀 Claude Desktop 配置</h3>
          <p>从零开始配置你的第一个 MCP Server</p>
        </a>
        <a href="/clients/cursor.html" class="card">
          <h3>⚡ Cursor 配置</h3>
          <p>在 Cursor 编辑器中接入 MCP</p>
        </a>
        <a href="/guides/security-checklist.html" class="card">
          <h3>🛡️ 安全检查清单</h3>
          <p>接入前必须确认的权限和风险</p>
        </a>
        <a href="/guides/common-errors.html" class="card">
          <h3>🔧 常见报错排查</h3>
          <p>连接失败、命令找不到怎么办</p>
        </a>
      </div>
    </section>

    <section class="section">
      <h2>按场景浏览</h2>
      <div class="card-grid card-scene">
        ${categories.map(c => `
          <a href="/categories/${c.slug}.html" class="card">
            <span class="card-emoji">${c.icon}</span>
            <h3>${c.name}</h3>
            <p>${c.description}</p>
            <span class="card-count">${servers.filter(s => s.category === c.id).length} 个工具</span>
          </a>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <h2>低风险入门推荐</h2>
      <p>以下工具权限范围小、不需要 API Key 或只进行只读操作，适合新手第一次体验 MCP。安装后即可在对话中使用，无需额外配置。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>工具</th><th>场景</th><th>风险</th><th>说明</th></tr></thead>
          <tbody>
            ${lowRisk.map(s => `<tr>
              <td><a href="/servers/${s.slug}.html">${escapeHtml(s.name)}</a></td>
              <td>${categories.find(c => c.id === s.category)?.name || ''}</td>
              <td>${riskBadge(s.riskLevel)}</td>
              <td>${escapeHtml(s.description)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>配置工具</h2>
      <div class="card-grid">
        <a href="/tools/config-builder.html" class="card">
          <h3>⚙️ 配置片段生成器</h3>
          <p>选择 MCP Server，自动生成 JSON 配置片段，支持多工具组合导出</p>
        </a>
        <a href="/servers/index.html" class="card">
          <h3>📋 完整资料库</h3>
          <p>查看全部 ${servers.length} 个工具，按场景、风险和 API Key 需求筛选</p>
        </a>
      </div>
    </section>

    <section class="section">
      <h2>最近核验</h2>
      <p>以下工具最近完成了信息核验，配置和版本信息已确认有效。</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>工具</th><th>场景</th><th>核验日期</th><th>状态</th></tr></thead>
          <tbody>
            ${recentlyChecked.map(s => `<tr>
              <td><a href="/servers/${s.slug}.html">${escapeHtml(s.name)}</a></td>
              <td>${categories.find(c => c.id === s.category)?.name || ''}</td>
              <td>${s.lastCheckedAt}</td>
              <td>${s.verificationStatus}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>常见问题</h2>
      <div class="faq-list">
        <details class="faq-item">
          <summary>MCP Server 和普通插件有什么区别？</summary>
          <div class="faq-answer">MCP（Model Context Protocol）是一个标准化协议，一个 Server 可以被 Claude Desktop、Cursor、VS Code 等多个客户端使用。普通插件通常只适用于特定工具，且接口不统一。MCP 的优势是"写一次，到处用"。</div>
        </details>
        <details class="faq-item">
          <summary>需要编程基础才能使用 MCP 吗？</summary>
          <div class="faq-answer">基础使用只需要编辑 JSON 配置文件，不需要写代码。你需要了解如何打开终端、找到配置文件路径、设置环境变量。本站的客户端教程会一步步引导你完成。</div>
        </details>
        <details class="faq-item">
          <summary>MCP Server 安全吗？</summary>
          <div class="faq-answer">取决于具体工具的权限范围。文件系统类工具可以读写你的文件，数据库类可以查询数据，浏览器类可以访问网页。本站为每个工具标注了风险等级和权限说明，建议从低风险工具开始体验。</div>
        </details>
        <details class="faq-item">
          <summary>新手应该先装哪个 MCP？</summary>
          <div class="faq-answer">推荐从 Filesystem（文件读写）、Fetch（网页读取）或 Sequential Thinking（结构化思考）开始。这些工具风险低、不需要 API Key、安装简单。详见<a href="/guides/beginner-recommendations.html">新手推荐指南</a>。</div>
        </details>
        <details class="faq-item">
          <summary>本站的工具信息多久更新一次？</summary>
          <div class="faq-answer">每个工具条目标注了最近核验日期。我们会定期检查官方仓库和文档变化。超过 60 天未核验的工具会标记为"待复核"。如果你发现信息过期，欢迎通过联系页面反馈。</div>
        </details>
      </div>
    </section>`;

  const html = layout(
    `${SITE_NAME} - 配置教程、权限说明与常见报错`,
    '按客户端、使用场景、安装方式和权限范围筛选 AI Agent 工具与 MCP Server，查看配置步骤、常见错误和安全注意事项。',
    '/',
    content,
    '',
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL,
      "description": "按客户端、使用场景、安装方式和权限范围筛选 AI Agent 工具与 MCP Server，查看配置步骤、常见错误和安全注意事项。",
      "potentialAction": {
        "@type": "SearchAction",
        "target": SITE_URL + "/servers/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  );
  writeFileSync(join(SITE_DIR, 'index.html'), html);
}

// PLACEHOLDER_MORE_GENERATORS

function buildServersIndex() {
  const lowCount = servers.filter(s => s.riskLevel === 'low').length;
  const mediumCount = servers.filter(s => s.riskLevel === 'medium').length;
  const highCount = servers.filter(s => s.riskLevel === 'high').length;

  const content = `
    <h1>MCP Server 工具资料库</h1>
    <div class="stats-bar">
      <span class="stat-item">共 <strong>${servers.length}</strong> 个工具</span>
      <span class="stat-item">低风险 <strong>${lowCount}</strong> 个</span>
      <span class="stat-item">中风险 <strong>${mediumCount}</strong> 个</span>
      <span class="stat-item">高风险 <strong>${highCount}</strong> 个</span>
    </div>
    <div class="search-box">
      <input type="text" id="search-input" placeholder="搜索工具名称、场景或关键词..." aria-label="搜索工具">
    </div>
    <div class="filters">
      <select id="filter-category" aria-label="按场景筛选">
        <option value="">全部场景</option>
        ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <select id="filter-risk" aria-label="按风险筛选">
        <option value="">全部风险</option>
        <option value="low">低风险</option>
        <option value="medium">中风险</option>
        <option value="high">高风险</option>
      </select>
      <select id="filter-apikey" aria-label="是否需要API Key">
        <option value="">全部</option>
        <option value="no">无需 API Key</option>
        <option value="yes">需要 API Key</option>
      </select>
    </div>
    <div class="table-wrap">
      <table id="servers-table">
        <thead><tr><th>工具</th><th>场景</th><th>客户端</th><th>风险</th><th>核验日期</th></tr></thead>
        <tbody>
          ${servers.map(s => `<tr data-category="${s.category}" data-risk="${s.riskLevel}" data-apikey="${s.requiredEnv.length > 0 ? 'yes' : 'no'}">
            <td><a href="/servers/${s.slug}.html">${escapeHtml(s.name)}</a></td>
            <td>${categories.find(c => c.id === s.category)?.name || ''}</td>
            <td>${s.supportedClients.map(c => clients.find(cl => cl.id === c)?.name || c).join(', ')}</td>
            <td>${riskBadge(s.riskLevel)}</td>
            <td>${s.lastCheckedAt}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  const bc = breadcrumb([{name: '首页', href: '/'}, {name: '资料库'}]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "MCP Server 工具资料库",
      "description": `查看 ${servers.length} 个 MCP Server 工具，按场景、客户端、权限范围和风险等级筛选。`,
      "url": SITE_URL + "/servers/"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": "资料库", "item": SITE_URL + "/servers/"}
      ]
    }
  ];
  const html = layout(
    `MCP Server 工具资料库 - 按客户端、场景和权限筛选`,
    `查看 ${servers.length} 个 MCP Server 工具，按场景、客户端、权限范围和风险等级筛选。`,
    '/servers/',
    content,
    bc,
    jsonLd
  );
  ensureDir(join(SITE_DIR, 'servers'));
  writeFileSync(join(SITE_DIR, 'servers', 'index.html'), html);
}

function buildServerDetail(server) {
  const cat = categories.find(c => c.id === server.category);
  const related = servers.filter(s => s.category === server.category && s.id !== server.id).slice(0, 4);
  const configJson = JSON.stringify(server.configExample, null, 2);

  const content = `
    <h1>${escapeHtml(server.name)} MCP Server 配置与使用说明</h1>
    <div class="quick-info">
      <div class="quick-info-item">
        <span class="qi-icon">📦</span>
        <div><span class="qi-label">安装方式</span><span class="qi-value">${escapeHtml(server.installMethod)}</span></div>
      </div>
      <div class="quick-info-item">
        <span class="qi-icon">⚠️</span>
        <div><span class="qi-label">风险等级</span><span class="qi-value">${riskBadge(server.riskLevel)}</span></div>
      </div>
      <div class="quick-info-item">
        <span class="qi-icon">🔑</span>
        <div><span class="qi-label">API Key</span><span class="qi-value">${server.requiredEnv.length > 0 ? '需要' : '不需要'}</span></div>
      </div>
      <div class="quick-info-item">
        <span class="qi-icon">💻</span>
        <div><span class="qi-label">客户端</span><span class="qi-value">${server.supportedClients.length} 个支持</span></div>
      </div>
    </div>
    <p class="server-desc">${escapeHtml(server.description)}</p>
    <div class="meta-row">
      ${riskBadge(server.riskLevel)}
      <span class="meta-item">场景：${cat?.name || ''}</span>
      <span class="meta-item">核验：${server.lastCheckedAt}</span>
      <span class="meta-item">状态：${server.verificationStatus}</span>
    </div>

    <section class="section">
      <h2>支持客户端</h2>
      <ul>${server.supportedClients.map(c => `<li>${clients.find(cl => cl.id === c)?.name || c}</li>`).join('')}</ul>
    </section>

    <section class="section">
      <h2>安装命令</h2>
      <div class="code-block"><pre><code>${escapeHtml(server.installCommand)}</code></pre><button class="copy-btn" data-copy="${escapeHtml(server.installCommand)}">复制</button></div>
    </section>

    <section class="section">
      <h2>配置示例</h2>
      <div class="code-block"><pre><code>${escapeHtml(configJson)}</code></pre><button class="copy-btn" data-copy="${escapeHtml(configJson)}">复制</button></div>
      ${server.requiredEnv.length > 0 ? `<p class="warning">需要设置环境变量：${server.requiredEnv.join(', ')}。不要把这些值提交到公开仓库。</p>` : ''}
    </section>

    <section class="section">
      <h2>权限范围与安全提示</h2>
      <p>${escapeHtml(server.riskExplanation)}</p>
      <ul>${server.permissionScope.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
      <p class="risk-score">风险评分：${server.riskScore}/10</p>
    </section>

    ${server.commonErrors.length > 0 ? `
    <section class="section">
      <h2>常见报错</h2>
      <dl class="faq">
        ${server.commonErrors.map(e => `<dt>${escapeHtml(e.error)}</dt><dd>${escapeHtml(e.solution)}</dd>`).join('')}
      </dl>
    </section>` : ''}

    <section class="section">
      <h2>来源</h2>
      <ul>
        ${server.officialUrl ? `<li><a href="${server.officialUrl}" target="_blank" rel="noopener noreferrer">官方文档 / 仓库</a></li>` : ''}
      </ul>
      <p class="note">最近核验：${server.lastCheckedAt}。客户端版本和配置格式可能变化，使用前请以官方文档为准。</p>
    </section>

    ${related.length > 0 ? `
    <section class="section">
      <h2>相关工具</h2>
      <div class="card-grid">
        ${related.map(r => `<a href="/servers/${r.slug}.html" class="card"><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.description)}</p></a>`).join('')}
      </div>
    </section>` : ''}`;

  const bc = breadcrumb([
    {name: '首页', href: '/'},
    {name: '资料库', href: '/servers/'},
    {name: server.name}
  ]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": server.name + " MCP Server",
      "description": server.description,
      "url": SITE_URL + "/servers/" + server.slug,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Windows, macOS, Linux"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": "资料库", "item": SITE_URL + "/servers/"},
        {"@type": "ListItem", "position": 3, "name": server.name, "item": SITE_URL + "/servers/" + server.slug}
      ]
    }
  ];
  const html = layout(
    `${server.name} MCP Server 配置说明 - 安装命令、权限范围与常见报错`,
    `查看 ${server.name} 的 MCP Server 用途、支持客户端、安装命令、配置示例、权限范围和最近核验日期。`,
    `/servers/${server.slug}.html`,
    content,
    bc,
    jsonLd
  );
  writeFileSync(join(SITE_DIR, 'servers', `${server.slug}.html`), html);
}

function buildCategoryPage(category) {
  const catServers = servers.filter(s => s.category === category.id);
  const content = `
    <h1>${category.icon} ${category.name}</h1>
    <p>${category.description}</p>
    <p>共 ${catServers.length} 个工具。</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>工具</th><th>风险</th><th>说明</th><th>核验</th></tr></thead>
        <tbody>
          ${catServers.map(s => `<tr>
            <td><a href="/servers/${s.slug}.html">${escapeHtml(s.name)}</a></td>
            <td>${riskBadge(s.riskLevel)}</td>
            <td>${escapeHtml(s.description)}</td>
            <td>${s.lastCheckedAt}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  const bc = breadcrumb([{name: '首页', href: '/'}, {name: '分类', href: '/servers/'}, {name: category.name}]);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": category.name + " MCP Server",
      "description": `${category.name}类 MCP Server 工具列表，包含安装命令、权限范围和风险等级。`,
      "url": SITE_URL + "/categories/" + category.slug
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": "分类", "item": SITE_URL + "/servers/"},
        {"@type": "ListItem", "position": 3, "name": category.name, "item": SITE_URL + "/categories/" + category.slug}
      ]
    }
  ];
  const html = layout(
    `${category.name} MCP Server - AI Agent 工具目录`,
    `${category.name}类 MCP Server 工具列表，包含安装命令、权限范围和风险等级。`,
    `/categories/${category.slug}.html`,
    content,
    bc,
    jsonLd
  );
  ensureDir(join(SITE_DIR, 'categories'));
  writeFileSync(join(SITE_DIR, 'categories', `${category.slug}.html`), html);
}

// PLACEHOLDER_TRUST_AND_TOOLS

function buildTrustPages() {
  const pages = [
    {
      slug: 'about',
      title: '关于本站',
      content: `<h1>关于本站</h1>
        <p>本站是面向中文用户的 AI Agent 与 MCP Server 工具目录，帮助开发者按使用场景、客户端、安装方式和权限范围筛选工具，并提供配置步骤、常见错误排查和安全检查清单。</p>
        <h2>内容来源</h2>
        <p>工具信息来自官方文档、GitHub 仓库、npm/PyPI 包页面和客户端官方文档。每个工具条目标注最近核验日期，超过 60 天未核验的标记为"待复核"。</p>
        <h2>本站不做什么</h2>
        <ul>
          <li>不托管用户密钥或配置文件</li>
          <li>不代理用户调用任何 API</li>
          <li>不提供远程执行服务</li>
          <li>不保证第三方工具的安全性和可用性</li>
          <li>不提供绕过平台限制或攻击性自动化教程</li>
        </ul>
        <h2>联系</h2>
        <p>如发现工具信息过期、配置错误或有安全问题，请通过 <a href="/pages/contact.html">联系页面</a> 反馈。</p>`
    },
    {
      slug: 'contact',
      title: '联系我们',
      content: `<h1>联系我们</h1>
        <p>如果你发现以下问题，欢迎通过邮件反馈：</p>
        <ul>
          <li>工具信息过期或不准确</li>
          <li>安装命令或配置示例有误</li>
          <li>页面链接失效</li>
          <li>安全风险未标注</li>
          <li>功能建议或新工具推荐</li>
          <li>合作咨询</li>
        </ul>
        <p>联系邮箱：<strong>${CONTACT_EMAIL}</strong></p>
        <h2>请不要发送</h2>
        <p>为保护你的安全，请不要在邮件中包含：</p>
        <ul>
          <li>API Key、Token、密码或私钥</li>
          <li>身份证号或完整合同</li>
          <li>财务凭证或支付信息</li>
          <li>客户数据或敏感业务信息</li>
        </ul>`
    },
    {
      slug: 'privacy',
      title: '隐私政策',
      content: `<h1>隐私政策</h1>
        <h2>数据处理方式</h2>
        <ul>
          <li>本站为纯静态站点，不需要注册登录。</li>
          <li>配置生成器等工具在浏览器本地处理，不上传用户输入到服务器。</li>
          <li>本站不保存用户的 API Key、配置文件或任何敏感信息。</li>
        </ul>
        <h2>访问统计</h2>
        <p>本站已接入百度统计（Baidu Analytics），用于了解汇总访问量、访问来源和页面使用情况。统计服务可能使用 Cookie 或类似技术生成匿名访问指标，不用于识别个人身份。</p>
        <h2>外部链接</h2>
        <p>本站包含指向第三方网站的链接（官方文档、GitHub 仓库等）。点击外部链接后，数据处理由第三方网站负责，本站不对第三方网站的隐私政策负责。</p>
        <h2>Cookie</h2>
        <p>本站核心功能不依赖 Cookie。百度统计等访问统计服务可能使用 Cookie 或类似技术用于匿名、汇总的访问统计。</p>
        <h2>联系</h2>
        <p>如有隐私相关问题，请联系：${CONTACT_EMAIL}</p>`
    },
    {
      slug: 'disclaimer',
      title: '免责声明',
      content: `<h1>免责声明</h1>
        <h2>内容性质</h2>
        <p>本站提供的工具信息、配置示例、教程步骤和安全提示仅供参考，不构成专业建议。</p>
        <h2>第三方工具</h2>
        <ul>
          <li>本站收录的 MCP Server 由各自的开发者或组织维护，本站不保证其安全性、稳定性和可用性。</li>
          <li>使用任何工具前，请自行评估权限范围和安全风险。</li>
          <li>连接公司系统、客户数据或生产数据库前，应经过团队安全审核。</li>
        </ul>
        <h2>信息时效</h2>
        <p>工具的安装命令、配置格式、支持的客户端版本和功能范围可能随时变化。本站标注核验日期，但不保证信息始终最新。使用前请以官方文档为准。</p>
        <h2>责任边界</h2>
        <p>因使用本站信息导致的任何损失（包括但不限于数据丢失、凭据泄露、系统故障），本站不承担责任。</p>
        <h2>联系</h2>
        <p>如发现信息错误或过期，请联系：${CONTACT_EMAIL}</p>`
    }
  ];

  ensureDir(join(SITE_DIR, 'pages'));
  for (const page of pages) {
    const bc = breadcrumb([{name: '首页', href: '/'}, {name: page.title}]);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": page.title, "item": SITE_URL + "/pages/" + page.slug}
      ]
    };
    const html = layout(
      `${page.title} - ${SITE_NAME}`,
      `${SITE_NAME} ${page.title}`,
      `/pages/${page.slug}.html`,
      page.content,
      bc,
      jsonLd
    );
    writeFileSync(join(SITE_DIR, 'pages', `${page.slug}.html`), html);
  }
}

function buildConfigBuilder() {
  const content = `
    <h1>MCP 配置片段生成器</h1>
    <p>选择你要使用的 MCP Server，自动生成配置 JSON 片段。生成结果在浏览器本地处理，不上传任何信息。</p>
    <div data-servers-path="../data/servers.json" style="display:none"></div>

    <div class="tool-section">
      <h2>选择客户端</h2>
      <select id="client-select" aria-label="选择客户端">
        <option value="claude-desktop">Claude Desktop</option>
        <option value="cursor">Cursor</option>
      </select>
    </div>

    <div class="tool-section">
      <h2>选择 MCP Server</h2>
      <div id="server-checkboxes">
        ${servers.map(s => `
          <label class="checkbox-item">
            <input type="checkbox" value="${s.id}" data-name="${escapeHtml(s.name)}">
            <span>${escapeHtml(s.name)}</span>
            ${riskBadge(s.riskLevel)}
          </label>
        `).join('')}
      </div>
    </div>

    <div class="tool-section">
      <h2>生成结果</h2>
      <div class="code-block">
        <pre><code id="config-output">请选择至少一个 MCP Server</code></pre>
        <button class="copy-btn" id="copy-config-btn">复制配置</button>
      </div>
      <p class="note">生成的配置中，环境变量占位符（如 &lt;your-token&gt;）需要替换为你的真实值。不要把真实 Key 提交到公开仓库。</p>
    </div>

    <div class="tool-section">
      <h2>配置文件位置</h2>
      <div id="config-path-info">
        <p><strong>Claude Desktop：</strong></p>
        <ul>
          <li>macOS：<code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
          <li>Windows：<code>%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
        </ul>
      </div>
    </div>

    <section class="section">
      <h2>使用说明</h2>
      <ol>
        <li>选择你使用的客户端。</li>
        <li>勾选需要的 MCP Server。</li>
        <li>复制生成的 JSON 配置。</li>
        <li>粘贴到对应客户端的配置文件中。</li>
        <li>替换环境变量占位符为真实值。</li>
        <li>重启客户端使配置生效。</li>
      </ol>
    </section>

    <section class="section">
      <h2>注意事项</h2>
      <ul>
        <li>本工具在浏览器本地生成配置，不收集任何信息。</li>
        <li>生成的配置仅供参考，实际格式以客户端官方文档为准。</li>
        <li>高风险工具（红色标签）请在使用前确认权限范围。</li>
      </ul>
    </section>`;

  const bc = breadcrumb([{name: '首页', href: '/'}, {name: '配置生成器'}]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
      {"@type": "ListItem", "position": 2, "name": "配置生成器", "item": SITE_URL + "/tools/config-builder"}
    ]
  };
  const html = layout(
    'MCP 配置片段生成器 - 自动生成 JSON 配置',
    '选择 MCP Server，自动生成 Claude Desktop 或 Cursor 的 JSON 配置片段。浏览器本地处理，不收集用户信息。',
    '/tools/config-builder.html',
    content,
    bc,
    jsonLd
  );
  ensureDir(join(SITE_DIR, 'tools'));
  writeFileSync(join(SITE_DIR, 'tools', 'config-builder.html'), html);
}

function buildClientPages() {
  ensureDir(join(SITE_DIR, 'clients'));
  for (const client of clients) {
    const clientServers = servers.filter(s => s.supportedClients.includes(client.id));
    const content = `
      <h1>${client.name} MCP 配置教程</h1>
      <p>${client.description}</p>

      <section class="section">
        <h2>配置文件位置</h2>
        <ul>
          ${Object.entries(client.configFilePath).map(([k, v]) => `<li><strong>${k}：</strong><code>${escapeHtml(v)}</code></li>`).join('')}
        </ul>
      </section>

      <section class="section">
        <h2>配置步骤</h2>
        <ol>
          <li>找到或创建配置文件（路径见上方）。</li>
          <li>在文件中添加 <code>mcpServers</code> 字段。</li>
          <li>填入 MCP Server 的 command、args 和 env。</li>
          <li>${escapeHtml(client.restartMethod)}</li>
          <li>${escapeHtml(client.verifyMethod)}</li>
        </ol>
      </section>

      <section class="section">
        <h2>配置示例</h2>
        <div class="code-block"><pre><code>${escapeHtml(JSON.stringify({mcpServers: {filesystem: servers[0].configExample.mcpServers.filesystem}}, null, 2))}</code></pre><button class="copy-btn" data-copy='${escapeHtml(JSON.stringify({mcpServers: {filesystem: servers[0].configExample.mcpServers.filesystem}}, null, 2))}'>复制</button></div>
      </section>

      <section class="section">
        <h2>支持的 MCP Server（${clientServers.length} 个）</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>工具</th><th>场景</th><th>风险</th></tr></thead>
            <tbody>
              ${clientServers.map(s => `<tr>
                <td><a href="/servers/${s.slug}.html">${escapeHtml(s.name)}</a></td>
                <td>${categories.find(c => c.id === s.category)?.name || ''}</td>
                <td>${riskBadge(s.riskLevel)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>配置文件不存在怎么办？</dt>
          <dd>手动创建该文件，内容为 <code>{"mcpServers": {}}</code>，然后添加你需要的 Server。</dd>
          <dt>修改配置后不生效？</dt>
          <dd>${escapeHtml(client.restartMethod)}</dd>
          <dt>怎么确认 MCP 已连接？</dt>
          <dd>${escapeHtml(client.verifyMethod)}</dd>
        </dl>
      </section>

      <section class="section">
        <h2>安全注意事项</h2>
        <ul>
          <li>不要把包含 API Key 的配置文件提交到公开仓库。</li>
          <li>建议将配置文件加入 .gitignore。</li>
          <li>使用高风险 MCP 前确认权限范围。</li>
        </ul>
      </section>

      <p class="note">最近核验：${client.lastCheckedAt}。客户端版本和配置格式可能变化，使用前请以 <a href="${client.docsUrl}" target="_blank" rel="noopener noreferrer">官方文档</a> 为准。</p>`;

    const bc = breadcrumb([{name: '首页', href: '/'}, {name: '客户端教程'}, {name: client.name}]);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": "客户端教程", "item": SITE_URL + "/clients/" + clients[0].slug},
        {"@type": "ListItem", "position": 3, "name": client.name, "item": SITE_URL + "/clients/" + client.slug}
      ]
    };
    const html = layout(
      `${client.name} MCP 配置教程 - 配置文件位置、JSON 示例与排错清单`,
      `从零开始在 ${client.name} 中配置 MCP Server，包含配置文件位置、JSON 示例、验证方法和常见报错。`,
      `/clients/${client.slug}.html`,
      content,
      bc,
      jsonLd
    );
    writeFileSync(join(SITE_DIR, 'clients', `${client.slug}.html`), html);
  }
}

// PLACEHOLDER_SITEMAP_AND_MAIN

function getGuideContent(guideId) {
  const guideContents = {
    'what-is-mcp': `
      <h1>MCP Server 是什么</h1>
      <p class="intro">MCP（Model Context Protocol）是 Anthropic 提出的开放协议，用于标准化 AI 模型与外部工具、数据源之间的通信方式。MCP Server 是实现该协议的服务端程序，为 AI 客户端提供工具调用能力。</p>

      <section class="section">
        <h2>核心概念</h2>
        <p>MCP 定义了三个角色：</p>
        <ul>
          <li><strong>Host（宿主）</strong>：用户直接交互的应用程序，如 Claude Desktop、Cursor 等。</li>
          <li><strong>Client（客户端）</strong>：Host 内部的 MCP 协议客户端，负责与 Server 通信。</li>
          <li><strong>Server（服务端）</strong>：提供具体工具能力的程序，如文件系统访问、数据库查询、API 调用等。</li>
        </ul>
        <p>一个 Host 可以同时连接多个 MCP Server，每个 Server 提供不同的工具集。</p>
      </section>

      <section class="section">
        <h2>MCP Server 与普通插件的区别</h2>
        <table>
          <thead><tr><th>对比项</th><th>MCP Server</th><th>普通插件</th></tr></thead>
          <tbody>
            <tr><td>协议</td><td>标准化的 JSON-RPC 协议</td><td>各平台私有 API</td></tr>
            <tr><td>复用性</td><td>一个 Server 可被多个客户端使用</td><td>通常只适用于特定平台</td></tr>
            <tr><td>运行方式</td><td>独立进程，通过 stdio 或 HTTP 通信</td><td>通常在宿主进程内运行</td></tr>
            <tr><td>开发语言</td><td>任意语言（Node.js、Python 等）</td><td>受限于平台 SDK</td></tr>
            <tr><td>安全边界</td><td>进程隔离，权限可控</td><td>通常共享宿主权限</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>工作原理</h2>
        <p>MCP 的通信流程如下：</p>
        <ol>
          <li>Host 启动时，根据配置文件启动 MCP Server 子进程。</li>
          <li>Client 通过 stdio（标准输入输出）与 Server 建立 JSON-RPC 连接。</li>
          <li>Server 向 Client 声明自己提供的工具列表（tools）和资源（resources）。</li>
          <li>用户与 AI 对话时，AI 根据需要调用 Server 提供的工具。</li>
          <li>Server 执行操作并返回结果，AI 将结果整合到回复中。</li>
        </ol>
        <pre><code>用户 → Host(Claude Desktop) → Client → MCP Server → 外部服务/文件系统
                                                    ↓
                                              返回执行结果</code></pre>
      </section>

      <section class="section">
        <h2>MCP Server 能做什么</h2>
        <ul>
          <li>读写本地文件系统</li>
          <li>执行数据库查询</li>
          <li>调用第三方 API（GitHub、Slack、Notion 等）</li>
          <li>运行 Shell 命令</li>
          <li>搜索和抓取网页内容</li>
          <li>管理日历和邮件</li>
        </ul>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>MCP Server 以本地进程运行，拥有你授予的系统权限，接入前务必确认权限范围。</li>
          <li>不同 Server 的风险等级不同，文件只读类风险低，能执行命令或访问网络的风险高。</li>
          <li>MCP 协议仍在快速迭代中，配置格式可能随客户端版本变化。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>MCP 是 Anthropic 专有的吗？</dt>
          <dd>MCP 是开放协议，规范和 SDK 均开源。任何 AI 客户端都可以实现 MCP 支持，目前 Claude Desktop、Cursor、Windsurf 等已支持。</dd>
          <dt>使用 MCP 需要编程基础吗？</dt>
          <dd>基础使用只需编辑 JSON 配置文件，不需要写代码。但理解命令行操作和环境变量概念会有帮助。</dd>
          <dt>MCP Server 会自动更新吗？</dt>
          <dd>不会。MCP Server 通过 npx 或 uvx 运行时会拉取最新版本，但本地安装的需要手动更新。建议定期检查官方仓库的更新日志。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">MCP 官方文档</a></li>
          <li><a href="https://github.com/modelcontextprotocol" target="_blank" rel="noopener noreferrer">MCP GitHub 组织</a></li>
          <li><a href="/guides/claude-desktop-setup.html">Claude Desktop MCP 配置教程</a></li>
          <li><a href="/guides/config-json-explained.html">MCP 配置 JSON 字段说明</a></li>
        </ul>
      </section>`,

    'claude-desktop-setup': `
      <h1>Claude Desktop MCP 配置教程</h1>
      <p class="intro">本教程帮助你从零开始在 Claude Desktop 中配置 MCP Server。完成后，Claude 将能够调用外部工具完成文件操作、网页搜索等任务。</p>

      <section class="section">
        <h2>前置条件</h2>
        <ul>
          <li>已安装 Claude Desktop（macOS 或 Windows）</li>
          <li>已安装 Node.js 18 或更高版本（用于运行基于 Node.js 的 MCP Server）</li>
          <li>了解基本的命令行操作</li>
        </ul>
        <p>检查 Node.js 是否已安装：</p>
        <pre><code>node --version
# 应输出 v18.x.x 或更高</code></pre>
      </section>

      <section class="section">
        <h2>配置步骤</h2>
        <h3>第一步：找到配置文件</h3>
        <p>Claude Desktop 的 MCP 配置文件位置：</p>
        <ul>
          <li><strong>macOS：</strong><code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
          <li><strong>Windows：</strong><code>%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
        </ul>
        <p>如果文件不存在，手动创建即可。</p>

        <h3>第二步：编辑配置文件</h3>
        <p>打开配置文件，写入以下内容（以 filesystem MCP Server 为例）：</p>
        <pre><code>{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/Documents"
      ]
    }
  }
}</code></pre>
        <p>将 <code>/Users/yourname/Documents</code> 替换为你希望 Claude 访问的目录路径。</p>

        <h3>第三步：重启 Claude Desktop</h3>
        <p>完全退出 Claude Desktop（不是最小化），然后重新打开。macOS 上可以在菜单栏右键图标选择"Quit"。</p>

        <h3>第四步：验证连接</h3>
        <p>重启后，在对话输入框左侧应该能看到一个锤子图标（工具图标）。点击它可以查看已连接的 MCP Server 和可用工具列表。</p>
      </section>

      <section class="section">
        <h2>添加多个 MCP Server</h2>
        <p>在 <code>mcpServers</code> 对象中添加多个键值对即可：</p>
        <pre><code>{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/Documents"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}</code></pre>
      </section>

      <section class="section">
        <h2>查看日志排查问题</h2>
        <p>如果 MCP Server 未正常连接，可以查看日志文件：</p>
        <ul>
          <li><strong>macOS：</strong><code>~/Library/Logs/Claude/mcp*.log</code></li>
          <li><strong>Windows：</strong><code>%APPDATA%\\Claude\\logs\\mcp*.log</code></li>
        </ul>
        <p>日志中会显示 Server 启动失败的具体原因。</p>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>配置文件必须是合法的 JSON 格式，多余的逗号或缺少引号都会导致解析失败。</li>
          <li>路径中的反斜杠（Windows）需要转义为双反斜杠，如 <code>"C:\\\\Users\\\\name\\\\Documents"</code>。</li>
          <li>每次修改配置后都需要完全重启 Claude Desktop。</li>
          <li>不要把包含 API Key 的配置文件提交到公开仓库。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>配置后看不到工具图标怎么办？</dt>
          <dd>确认已完全重启（不是刷新窗口）。检查配置文件 JSON 格式是否正确，可以用 <code>cat config.json | python -m json.tool</code> 验证。查看日志文件获取具体错误信息。</dd>
          <dt>npx 命令找不到怎么办？</dt>
          <dd>确认 Node.js 已正确安装且在系统 PATH 中。在终端运行 <code>which npx</code>（macOS）或 <code>where npx</code>（Windows）确认路径。如果使用 nvm，可能需要在配置中写 npx 的完整路径。</dd>
          <dt>可以同时连接多少个 MCP Server？</dt>
          <dd>没有硬性限制，但每个 Server 都是独立进程，过多会占用系统资源。建议只启用当前需要的 Server。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="https://docs.anthropic.com/en/docs/claude-desktop/mcp" target="_blank" rel="noopener noreferrer">Claude Desktop MCP 官方文档</a></li>
          <li><a href="/guides/config-json-explained.html">MCP 配置 JSON 字段说明</a></li>
          <li><a href="/guides/common-errors.html">MCP Server 常见报错排查</a></li>
          <li><a href="/tools/config-builder.html">配置片段生成器</a></li>
        </ul>
      </section>`,

    'cursor-setup': `
      <h1>Cursor MCP 配置教程</h1>
      <p class="intro">Cursor 是一款 AI 驱动的代码编辑器，支持通过 MCP 协议接入外部工具。本教程介绍如何在 Cursor 中配置 MCP Server。</p>

      <section class="section">
        <h2>前置条件</h2>
        <ul>
          <li>已安装 Cursor 编辑器（0.45 或更高版本）</li>
          <li>已安装 Node.js 18+（用于 npx 类 Server）或 Python 3.10+（用于 uvx 类 Server）</li>
        </ul>
      </section>

      <section class="section">
        <h2>配置步骤</h2>
        <h3>第一步：打开 MCP 设置</h3>
        <p>在 Cursor 中，通过以下路径进入 MCP 配置：</p>
        <ol>
          <li>打开 Settings（快捷键 <code>Cmd+,</code> 或 <code>Ctrl+,</code>）</li>
          <li>在左侧菜单找到 "MCP" 选项</li>
          <li>点击 "Add new MCP server" 按钮</li>
        </ol>
        <p>也可以直接编辑项目根目录下的 <code>.cursor/mcp.json</code> 文件。</p>

        <h3>第二步：编辑配置文件</h3>
        <p>Cursor 的 MCP 配置文件位置：</p>
        <ul>
          <li><strong>项目级别：</strong><code>.cursor/mcp.json</code>（项目根目录下）</li>
          <li><strong>全局级别：</strong><code>~/.cursor/mcp.json</code>（用户目录下）</li>
        </ul>
        <p>配置文件格式示例：</p>
        <pre><code>{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/project"
      ]
    }
  }
}</code></pre>

        <h3>第三步：验证连接</h3>
        <p>配置保存后，Cursor 会自动尝试连接 MCP Server。在 MCP 设置页面中，已连接的 Server 旁边会显示绿色状态指示器。</p>
        <p>如果显示红色或黄色，点击 Server 名称查看错误详情。</p>
      </section>

      <section class="section">
        <h2>在 Agent 模式中使用</h2>
        <p>MCP 工具在 Cursor 的 Agent 模式（Composer Agent）中可用：</p>
        <ol>
          <li>打开 Composer（<code>Cmd+I</code> 或 <code>Ctrl+I</code>）</li>
          <li>切换到 Agent 模式</li>
          <li>AI 会根据需要自动调用已连接的 MCP 工具</li>
        </ol>
        <p>注意：普通的 Chat 模式和 Edit 模式不支持 MCP 工具调用。</p>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>项目级配置（<code>.cursor/mcp.json</code>）会被提交到版本控制，不要在其中写入 API Key。</li>
          <li>需要 API Key 的 Server，建议使用环境变量方式配置，Key 存放在 <code>.env</code> 文件中并加入 <code>.gitignore</code>。</li>
          <li>Cursor 的 MCP 支持仍在快速迭代中，配置格式可能随版本更新变化。</li>
          <li>如果 Server 启动失败，尝试在终端手动运行 command + args 确认命令本身是否正常。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>项目级和全局配置有什么区别？</dt>
          <dd>项目级配置只在该项目中生效，适合项目特定的工具（如数据库连接）。全局配置对所有项目生效，适合通用工具（如文件搜索、网页抓取）。两者同时存在时会合并。</dd>
          <dt>Cursor 中 MCP 工具不响应怎么办？</dt>
          <dd>确认你在使用 Agent 模式（不是普通 Chat）。检查 MCP 设置页面中 Server 状态是否为绿色。尝试点击 "Restart" 按钮重启 Server。</dd>
          <dt>能否在 Cursor 中使用 Claude Desktop 的 MCP 配置？</dt>
          <dd>不能直接共用。两者的配置文件路径和格式略有不同，需要分别配置。但 MCP Server 本身是通用的，同一个 Server 可以同时被两个客户端使用。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="https://docs.cursor.com/context/model-context-protocol" target="_blank" rel="noopener noreferrer">Cursor MCP 官方文档</a></li>
          <li><a href="/guides/config-json-explained.html">MCP 配置 JSON 字段说明</a></li>
          <li><a href="/guides/common-errors.html">MCP Server 常见报错排查</a></li>
          <li><a href="/tools/config-builder.html">配置片段生成器</a></li>
        </ul>
      </section>`,

    'config-json-explained': `
      <h1>MCP 配置 JSON 字段说明</h1>
      <p class="intro">MCP 客户端通过 JSON 配置文件定义要启动的 Server。本文详细说明每个字段的含义、可选值和常见写法。</p>

      <section class="section">
        <h2>配置文件结构</h2>
        <p>一个典型的 MCP 配置文件结构如下：</p>
        <pre><code>{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}</code></pre>
      </section>

      <section class="section">
        <h2>字段详解</h2>
        <h3>mcpServers（顶层对象）</h3>
        <p>包含所有 MCP Server 配置的容器。每个键是 Server 的标识名（自定义），值是该 Server 的配置对象。</p>

        <h3>command（必填）</h3>
        <p>启动 MCP Server 的可执行命令。常见值：</p>
        <ul>
          <li><code>"npx"</code> - 运行 npm 包（Node.js 生态的 Server）</li>
          <li><code>"uvx"</code> - 运行 Python 包（Python 生态的 Server）</li>
          <li><code>"node"</code> - 直接运行 Node.js 脚本</li>
          <li><code>"python"</code> - 直接运行 Python 脚本</li>
          <li><code>"docker"</code> - 通过 Docker 容器运行</li>
        </ul>
        <p>注意：command 必须在系统 PATH 中可找到，或者使用完整路径。</p>

        <h3>args（必填）</h3>
        <p>传递给 command 的参数数组。每个参数是一个独立的字符串元素：</p>
        <pre><code>// 正确写法：每个参数独立
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/name/docs"]

// 错误写法：不要把多个参数合并为一个字符串
"args": ["-y @modelcontextprotocol/server-filesystem /Users/name/docs"]</code></pre>

        <h3>env（可选）</h3>
        <p>传递给 Server 进程的环境变量。用于提供 API Key、Token 等敏感配置：</p>
        <pre><code>"env": {
  "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
  "API_BASE_URL": "https://api.example.com"
}</code></pre>
        <p>这些环境变量只对该 Server 进程可见，不会影响系统环境。</p>
      </section>

      <section class="section">
        <h2>常见配置模式</h2>
        <h3>npx 运行 npm 包</h3>
        <pre><code>{
  "command": "npx",
  "args": ["-y", "package-name", "arg1", "arg2"]
}</code></pre>
        <p><code>-y</code> 参数表示自动确认安装，避免交互式提示阻塞启动。</p>

        <h3>uvx 运行 Python 包</h3>
        <pre><code>{
  "command": "uvx",
  "args": ["package-name", "--option", "value"]
}</code></pre>
        <p>uvx 是 uv 工具链的一部分，需要先安装 uv：<code>curl -LsSf https://astral.sh/uv/install.sh | sh</code></p>

        <h3>Docker 运行</h3>
        <pre><code>{
  "command": "docker",
  "args": ["run", "-i", "--rm", "image-name:tag"]
}</code></pre>
        <p>注意必须包含 <code>-i</code>（交互模式）以保持 stdio 通信。</p>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>JSON 格式要求严格：键名必须用双引号，末尾不能有多余逗号。</li>
          <li>Windows 路径中的反斜杠需要转义：<code>"C:\\\\Users\\\\name"</code>。</li>
          <li>Server 标识名（键名）建议使用小写字母和连字符，如 <code>"github-server"</code>。</li>
          <li>env 中的值必须是字符串类型，即使是数字也要加引号。</li>
          <li>不要把真实的 API Key 提交到公开仓库。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>command 写完整路径还是只写命令名？</dt>
          <dd>如果命令在系统 PATH 中，写命令名即可（如 <code>"npx"</code>）。如果使用 nvm 等版本管理器，PATH 可能不包含该命令，此时需要写完整路径（如 <code>"/Users/name/.nvm/versions/node/v20.0.0/bin/npx"</code>）。</dd>
          <dt>args 中的路径可以用波浪号（~）吗？</dt>
          <dd>取决于 Server 的实现。大多数情况下建议使用绝对路径，因为波浪号展开是 Shell 的功能，而 MCP Server 通常不经过 Shell 启动。</dd>
          <dt>env 中设置的变量会覆盖系统环境变量吗？</dt>
          <dd>是的，env 中的变量会覆盖同名的系统环境变量，但仅对该 Server 进程生效。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="/guides/claude-desktop-setup.html">Claude Desktop MCP 配置教程</a></li>
          <li><a href="/guides/cursor-setup.html">Cursor MCP 配置教程</a></li>
          <li><a href="/guides/api-key-management.html">API Key 和环境变量怎么保存</a></li>
          <li><a href="/tools/config-builder.html">配置片段生成器</a></li>
        </ul>
      </section>`,

    'common-errors': `
      <h1>MCP Server 常见报错排查</h1>
      <p class="intro">本文汇总 MCP Server 配置和使用过程中最常见的错误信息及解决方法。遇到问题时，先查看客户端日志获取具体错误信息。</p>

      <section class="section">
        <h2>如何查看错误日志</h2>
        <p>排查问题的第一步是找到日志文件：</p>
        <ul>
          <li><strong>Claude Desktop (macOS)：</strong><code>~/Library/Logs/Claude/mcp*.log</code></li>
          <li><strong>Claude Desktop (Windows)：</strong><code>%APPDATA%\\Claude\\logs\\mcp*.log</code></li>
          <li><strong>Cursor：</strong>在 MCP 设置页面点击 Server 名称查看错误详情</li>
        </ul>
      </section>

      <section class="section">
        <h2>错误 1：command not found / 命令找不到</h2>
        <p><strong>错误信息：</strong><code>spawn npx ENOENT</code> 或 <code>command not found: npx</code></p>
        <p><strong>原因：</strong>客户端启动 Server 时找不到指定的命令。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>确认命令已安装：在终端运行 <code>which npx</code>（macOS/Linux）或 <code>where npx</code>（Windows）</li>
          <li>如果使用 nvm/fnm 等版本管理器，在配置中使用完整路径：
            <pre><code>"command": "/Users/yourname/.nvm/versions/node/v20.0.0/bin/npx"</code></pre>
          </li>
          <li>对于 uvx，确认已安装 uv：<code>curl -LsSf https://astral.sh/uv/install.sh | sh</code></li>
        </ol>
      </section>

      <section class="section">
        <h2>错误 2：连接超时 / Server 无响应</h2>
        <p><strong>错误信息：</strong><code>MCP server connection timeout</code> 或 Server 状态一直显示"connecting"</p>
        <p><strong>原因：</strong>Server 进程启动了但没有正确响应 MCP 协议握手。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>在终端手动运行 command + args，确认命令本身能正常执行</li>
          <li>检查是否有交互式提示阻塞了启动（npx 缺少 <code>-y</code> 参数）</li>
          <li>确认网络连接正常（某些 Server 启动时需要下载依赖）</li>
          <li>检查是否有防火墙或代理阻止了本地通信</li>
        </ol>
      </section>

      <section class="section">
        <h2>错误 3：JSON 配置解析失败</h2>
        <p><strong>错误信息：</strong><code>SyntaxError: Unexpected token</code> 或客户端无法读取配置</p>
        <p><strong>原因：</strong>配置文件不是合法的 JSON 格式。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>检查是否有多余的逗号（最后一个元素后面不能有逗号）</li>
          <li>确认所有键名都用双引号包裹</li>
          <li>使用 JSON 验证工具检查：<code>cat config.json | python -m json.tool</code></li>
          <li>注意 Windows 路径的反斜杠需要转义为 <code>\\\\</code></li>
        </ol>
      </section>

      <section class="section">
        <h2>错误 4：权限不足 / Permission denied</h2>
        <p><strong>错误信息：</strong><code>EACCES: permission denied</code></p>
        <p><strong>原因：</strong>Server 尝试访问没有权限的文件或目录。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>确认 args 中指定的路径存在且当前用户有读取权限</li>
          <li>不要指向系统保护目录（如 <code>/System</code>、<code>C:\\Windows</code>）</li>
          <li>macOS 上可能需要在"系统设置 > 隐私与安全 > 文件和文件夹"中授权</li>
        </ol>
      </section>

      <section class="section">
        <h2>错误 5：环境变量未设置</h2>
        <p><strong>错误信息：</strong><code>API key not found</code> 或 <code>Missing required environment variable</code></p>
        <p><strong>原因：</strong>Server 需要的 API Key 或 Token 未在 env 字段中配置。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>查看 Server 文档确认需要哪些环境变量</li>
          <li>在配置的 env 字段中添加对应的键值对</li>
          <li>确认 Key 值正确且未过期</li>
        </ol>
        <pre><code>"env": {
  "GITHUB_TOKEN": "ghp_your_actual_token_here"
}</code></pre>
      </section>

      <section class="section">
        <h2>错误 6：版本不兼容</h2>
        <p><strong>错误信息：</strong><code>Unsupported protocol version</code> 或功能异常</p>
        <p><strong>原因：</strong>客户端和 Server 的 MCP 协议版本不匹配。</p>
        <p><strong>解决方法：</strong></p>
        <ol>
          <li>更新客户端到最新版本</li>
          <li>更新 Server 包：删除缓存后重新运行 npx（npx 会自动拉取最新版）</li>
          <li>查看 Server 仓库的 README 确认支持的协议版本</li>
        </ol>
      </section>

      <section class="section">
        <h2>通用排查步骤</h2>
        <ol>
          <li>查看日志文件获取具体错误信息</li>
          <li>在终端手动运行 command + args 确认命令可执行</li>
          <li>用 JSON 验证工具检查配置文件格式</li>
          <li>完全重启客户端（不是刷新窗口）</li>
          <li>尝试最简配置（只保留一个 Server）排除冲突</li>
        </ol>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>重启后问题依旧怎么办？</dt>
          <dd>尝试删除配置文件中的问题 Server，只保留一个已知可用的 Server 测试。如果单个 Server 也不行，可能是客户端版本问题，尝试更新或重装客户端。</dd>
          <dt>日志中没有有用信息怎么办？</dt>
          <dd>在终端手动运行 Server 命令，观察输出。例如：<code>npx -y @modelcontextprotocol/server-filesystem /tmp</code>，看是否有报错。</dd>
          <dt>macOS 上 npx 路径问题怎么彻底解决？</dt>
          <dd>找到 npx 的完整路径（<code>which npx</code>），然后在配置中使用完整路径替代 <code>"npx"</code>。如果使用 nvm，路径通常是 <code>~/.nvm/versions/node/vXX.X.X/bin/npx</code>。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="/guides/claude-desktop-setup.html">Claude Desktop MCP 配置教程</a></li>
          <li><a href="/guides/cursor-setup.html">Cursor MCP 配置教程</a></li>
          <li><a href="/guides/config-json-explained.html">MCP 配置 JSON 字段说明</a></li>
          <li><a href="/guides/security-checklist.html">MCP 权限风险检查清单</a></li>
        </ul>
      </section>`,

    'security-checklist': `
      <h1>MCP 权限风险检查清单</h1>
      <p class="intro">MCP Server 以本地进程运行，拥有你授予的系统权限。接入任何 MCP Server 前，请逐项确认以下检查清单，降低安全风险。</p>

      <section class="section">
        <h2>接入前必查项</h2>
        <table>
          <thead><tr><th>检查项</th><th>说明</th><th>风险</th></tr></thead>
          <tbody>
            <tr><td>来源可信度</td><td>是否来自官方仓库或知名开发者？Star 数和维护频率如何？</td><td>高</td></tr>
            <tr><td>权限范围</td><td>Server 声明了哪些工具？是否超出你的实际需求？</td><td>高</td></tr>
            <tr><td>文件系统访问</td><td>是否需要读写文件？访问范围是否限定在特定目录？</td><td>中-高</td></tr>
            <tr><td>网络访问</td><td>是否需要访问外部网络？连接哪些域名？</td><td>中</td></tr>
            <tr><td>命令执行</td><td>是否能执行 Shell 命令？是否有命令白名单限制？</td><td>高</td></tr>
            <tr><td>API Key 需求</td><td>需要哪些凭据？这些凭据的权限范围是什么？</td><td>中</td></tr>
            <tr><td>数据传输</td><td>是否会将本地数据发送到外部服务？</td><td>高</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>权限范围评估</h2>
        <h3>低风险特征</h3>
        <ul>
          <li>只读操作（如查询天气、搜索文档）</li>
          <li>不需要 API Key</li>
          <li>不访问文件系统或仅访问指定目录</li>
          <li>不执行 Shell 命令</li>
          <li>开源且有活跃社区审查</li>
        </ul>
        <h3>高风险特征</h3>
        <ul>
          <li>可执行任意 Shell 命令</li>
          <li>访问整个文件系统（根目录 <code>/</code>）</li>
          <li>需要高权限 API Key（如 GitHub 的 repo 写权限）</li>
          <li>可发送网络请求到任意域名</li>
          <li>闭源或缺乏社区审查</li>
          <li>能修改系统配置或安装软件</li>
        </ul>
      </section>

      <section class="section">
        <h2>凭据保护</h2>
        <ul>
          <li>API Key 只在配置文件的 env 字段中设置，不要硬编码在其他地方</li>
          <li>为每个服务创建专用的 API Key，使用最小权限原则</li>
          <li>定期轮换 Key，尤其是在怀疑泄露时</li>
          <li>不要把包含 Key 的配置文件提交到公开仓库</li>
          <li>将配置文件路径加入 <code>.gitignore</code></li>
        </ul>
        <pre><code># .gitignore
.cursor/mcp.json
claude_desktop_config.json
.env</code></pre>
      </section>

      <section class="section">
        <h2>企业环境额外检查</h2>
        <ul>
          <li>连接公司内部系统前，需经过团队安全审核</li>
          <li>不要将生产数据库的凭据配置到 MCP Server</li>
          <li>使用只读账号连接数据库类 Server</li>
          <li>确认 Server 不会将公司数据发送到外部</li>
          <li>在沙箱环境中先测试，确认行为符合预期后再用于正式环境</li>
        </ul>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>MCP Server 的权限等同于你的用户权限，它能做的事你都能做，反之亦然。</li>
          <li>AI 模型可能在对话中被诱导调用危险工具，限制 Server 的权限范围是最有效的防护。</li>
          <li>定期检查已安装的 Server 列表，移除不再使用的。</li>
          <li>关注 Server 仓库的安全公告和版本更新。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>如何限制 filesystem Server 的访问范围？</dt>
          <dd>在 args 中只指定需要访问的目录路径，不要指定根目录。例如 <code>"args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/name/projects"]</code> 只允许访问 projects 目录。</dd>
          <dt>第三方 MCP Server 安全吗？</dt>
          <dd>取决于具体项目。优先选择官方维护的 Server（@modelcontextprotocol 组织下的包）。第三方 Server 建议检查源码、Star 数、最近更新时间和 Issue 中是否有安全相关讨论。</dd>
          <dt>发现 MCP Server 有安全问题怎么办？</dt>
          <dd>立即从配置中移除该 Server 并重启客户端。如果涉及 API Key，立即轮换相关凭据。向 Server 仓库提交安全 Issue。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="/guides/api-key-management.html">API Key 和环境变量怎么保存</a></li>
          <li><a href="/guides/beginner-recommendations.html">新手适合先装哪些低风险 MCP</a></li>
          <li><a href="/guides/what-is-mcp.html">MCP Server 是什么</a></li>
          <li><a href="/servers/">MCP 工具资料库</a></li>
        </ul>
      </section>`,

    'beginner-recommendations': `
      <h1>新手适合先装哪些低风险 MCP</h1>
      <p class="intro">刚接触 MCP 的用户，建议从低风险、无需 API Key 的 Server 开始体验。本文推荐几个适合入门的 MCP Server，并说明推荐理由和安装顺序。</p>

      <section class="section">
        <h2>推荐原则</h2>
        <p>入门推荐的 Server 满足以下条件：</p>
        <ul>
          <li>由官方或知名组织维护</li>
          <li>不需要 API Key 或付费账号</li>
          <li>权限范围小，只读或限定目录</li>
          <li>安装简单，一条命令即可运行</li>
          <li>功能直观，容易验证是否正常工作</li>
        </ul>
      </section>

      <section class="section">
        <h2>推荐列表</h2>
        <h3>1. Filesystem Server（文件系统）</h3>
        <p><strong>推荐理由：</strong>官方维护，功能直观，可以限定访问目录。</p>
        <p><strong>能做什么：</strong>读取、创建、编辑指定目录下的文件。</p>
        <pre><code>{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/Documents"]
  }
}</code></pre>
        <p><strong>安全提示：</strong>只指定你希望 AI 访问的目录，不要指定根目录或用户主目录。</p>

        <h3>2. Fetch Server（网页抓取）</h3>
        <p><strong>推荐理由：</strong>官方维护，只读操作，不需要 API Key。</p>
        <p><strong>能做什么：</strong>抓取网页内容并转换为文本，方便 AI 阅读网页信息。</p>
        <pre><code>{
  "fetch": {
    "command": "uvx",
    "args": ["mcp-server-fetch"]
  }
}</code></pre>
        <p><strong>前置条件：</strong>需要安装 uv（Python 包管理器）。</p>

        <h3>3. Memory Server（知识记忆）</h3>
        <p><strong>推荐理由：</strong>官方维护，数据存储在本地，不联网。</p>
        <p><strong>能做什么：</strong>让 AI 在对话之间记住信息，构建知识图谱。</p>
        <pre><code>{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}</code></pre>

        <h3>4. Sequential Thinking Server（结构化思考）</h3>
        <p><strong>推荐理由：</strong>无外部依赖，不访问文件系统或网络。</p>
        <p><strong>能做什么：</strong>帮助 AI 进行分步推理，提升复杂问题的回答质量。</p>
        <pre><code>{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  }
}</code></pre>
      </section>

      <section class="section">
        <h2>建议安装顺序</h2>
        <ol>
          <li><strong>第一个：</strong>Filesystem Server - 最容易验证是否工作（让 AI 列出目录文件）</li>
          <li><strong>第二个：</strong>Fetch Server - 体验 AI 读取网页的能力</li>
          <li><strong>第三个：</strong>Memory Server - 体验跨对话记忆</li>
          <li><strong>之后：</strong>根据实际需求逐步添加其他 Server</li>
        </ol>
      </section>

      <section class="section">
        <h2>验证方法</h2>
        <p>安装后，可以用以下提示词测试：</p>
        <ul>
          <li>Filesystem：「请列出 /Users/yourname/Documents 目录下的文件」</li>
          <li>Fetch：「请帮我读取 https://example.com 的内容」</li>
          <li>Memory：「请记住我的名字是张三」然后新对话问「我叫什么名字」</li>
        </ul>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>即使是低风险 Server，也建议先阅读其 GitHub 仓库了解具体功能。</li>
          <li>不要一次性安装太多 Server，逐个添加便于排查问题。</li>
          <li>每添加一个 Server 后重启客户端并测试，确认正常再添加下一个。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>这些 Server 会收费吗？</dt>
          <dd>本文推荐的 Server 全部免费开源，不需要付费账号。但运行它们需要的 Node.js 或 Python 环境也是免费的。</dd>
          <dt>低风险是否意味着完全安全？</dt>
          <dd>低风险表示权限范围小、不太可能造成严重后果。但任何软件都可能有漏洞，建议保持更新并只授予必要的目录访问权限。</dd>
          <dt>想用需要 API Key 的 Server 怎么办？</dt>
          <dd>先熟悉基础配置流程后，再尝试需要 API Key 的 Server。参考 <a href="/guides/api-key-management.html">API Key 安全存储指南</a> 了解如何安全管理凭据。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="/guides/claude-desktop-setup.html">Claude Desktop MCP 配置教程</a></li>
          <li><a href="/guides/security-checklist.html">MCP 权限风险检查清单</a></li>
          <li><a href="/guides/api-key-management.html">API Key 和环境变量怎么保存</a></li>
          <li><a href="/servers/">MCP 工具资料库</a></li>
        </ul>
      </section>`,

    'api-key-management': `
      <h1>API Key 和环境变量怎么保存</h1>
      <p class="intro">许多 MCP Server 需要 API Key 或 Token 才能工作。本文介绍如何安全存储这些凭据，避免意外泄露到公开仓库或日志中。</p>

      <section class="section">
        <h2>核心原则</h2>
        <ul>
          <li><strong>不要硬编码：</strong>API Key 不应出现在代码文件或公开的配置文件中</li>
          <li><strong>不要提交：</strong>包含真实 Key 的文件不应被 git 跟踪</li>
          <li><strong>最小权限：</strong>为每个用途创建独立的 Key，只授予必要权限</li>
          <li><strong>定期轮换：</strong>定期更换 Key，尤其是怀疑泄露时立即更换</li>
        </ul>
      </section>

      <section class="section">
        <h2>方法一：直接写在 MCP 配置的 env 字段</h2>
        <p>最简单的方式，适合个人使用且配置文件不会被提交到公开仓库的场景：</p>
        <pre><code>{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}</code></pre>
        <p><strong>注意：</strong>确保该配置文件已加入 <code>.gitignore</code>，不会被提交到版本控制。</p>
      </section>

      <section class="section">
        <h2>方法二：使用 .env 文件 + 环境变量引用</h2>
        <p>将 Key 存放在单独的 <code>.env</code> 文件中，配置文件引用环境变量名：</p>
        <p><strong>第一步：</strong>创建 <code>.env</code> 文件：</p>
        <pre><code># .env 文件（不要提交到 git）
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx</code></pre>
        <p><strong>第二步：</strong>将 <code>.env</code> 加入 <code>.gitignore</code>：</p>
        <pre><code># .gitignore
.env
.env.local
.env.*.local</code></pre>
        <p><strong>第三步：</strong>在启动客户端前加载环境变量（macOS/Linux）：</p>
        <pre><code># 在 ~/.zshrc 或 ~/.bashrc 中添加
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"</code></pre>
        <p>Claude Desktop 会继承系统环境变量，因此 env 字段中可以引用已设置的变量。</p>
      </section>

      <section class="section">
        <h2>方法三：使用系统密钥管理工具</h2>
        <p>对安全性要求更高的场景，可以使用操作系统的密钥管理：</p>
        <h3>macOS Keychain</h3>
        <pre><code># 存储
security add-generic-password -a "mcp" -s "github-token" -w "ghp_xxxxxxxxxxxx"

# 读取（可在脚本中使用）
security find-generic-password -a "mcp" -s "github-token" -w</code></pre>

        <h3>Windows Credential Manager</h3>
        <p>通过"控制面板 > 凭据管理器"添加通用凭据，或使用 PowerShell：</p>
        <pre><code># 需要安装 CredentialManager 模块
Install-Module -Name CredentialManager
New-StoredCredential -Target "mcp-github" -UserName "token" -Password "ghp_xxxxxxxxxxxx"</code></pre>
      </section>

      <section class="section">
        <h2>各平台配置文件位置与保护</h2>
        <table>
          <thead><tr><th>客户端</th><th>配置文件位置</th><th>保护建议</th></tr></thead>
          <tbody>
            <tr><td>Claude Desktop (macOS)</td><td><code>~/Library/Application Support/Claude/claude_desktop_config.json</code></td><td>系统目录，默认不在 git 中</td></tr>
            <tr><td>Claude Desktop (Windows)</td><td><code>%APPDATA%\\Claude\\claude_desktop_config.json</code></td><td>系统目录，默认不在 git 中</td></tr>
            <tr><td>Cursor (项目级)</td><td><code>.cursor/mcp.json</code></td><td>加入 .gitignore</td></tr>
            <tr><td>Cursor (全局)</td><td><code>~/.cursor/mcp.json</code></td><td>系统目录，默认不在 git 中</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>泄露后的应急处理</h2>
        <ol>
          <li><strong>立即轮换：</strong>在对应平台（GitHub、OpenAI 等）立即撤销旧 Key 并生成新 Key</li>
          <li><strong>检查使用记录：</strong>查看 Key 的调用日志，确认是否有异常使用</li>
          <li><strong>清理 git 历史：</strong>如果 Key 被提交到 git，仅删除文件不够，需要清理历史记录</li>
          <li><strong>更新配置：</strong>用新 Key 更新所有使用该凭据的配置</li>
        </ol>
        <p><strong>重要：</strong>即使仓库是私有的，一旦 Key 进入 git 历史就应视为已泄露。GitHub 等平台会扫描公开仓库中的 Key 并自动通知。</p>
      </section>

      <section class="section">
        <h2>注意事项</h2>
        <ul>
          <li>不同服务的 Key 格式不同：GitHub 以 <code>ghp_</code> 开头，OpenAI 以 <code>sk-</code> 开头。</li>
          <li>创建 Key 时选择最小权限范围。例如 GitHub Token 只勾选 <code>repo:read</code> 而非全部权限。</li>
          <li>设置 Key 的过期时间，避免永久有效的 Key 被遗忘后泄露。</li>
          <li>团队协作时，每人使用自己的 Key，不要共享同一个。</li>
        </ul>
      </section>

      <section class="section">
        <h2>常见问题</h2>
        <dl class="faq">
          <dt>Claude Desktop 的配置文件需要加入 .gitignore 吗？</dt>
          <dd>Claude Desktop 的配置文件在系统应用数据目录中（不在项目目录），通常不会被 git 跟踪。但如果你把配置文件复制到了项目中做备份，那个副本需要加入 .gitignore。</dd>
          <dt>env 字段中的值会出现在日志中吗？</dt>
          <dd>正常情况下不会。但某些 Server 的调试日志可能打印环境变量，建议不要在生产环境开启 Server 的 debug 模式。</dd>
          <dt>可以多个 Server 共用同一个 API Key 吗？</dt>
          <dd>技术上可以，但不建议。为每个 Server 创建独立的 Key，这样某个 Key 泄露时只需要轮换一个，不影响其他 Server。</dd>
        </dl>
      </section>

      <section class="section">
        <h2>相关链接</h2>
        <ul>
          <li><a href="/guides/security-checklist.html">MCP 权限风险检查清单</a></li>
          <li><a href="/guides/config-json-explained.html">MCP 配置 JSON 字段说明</a></li>
          <li><a href="/guides/claude-desktop-setup.html">Claude Desktop MCP 配置教程</a></li>
          <li><a href="/guides/cursor-setup.html">Cursor MCP 配置教程</a></li>
        </ul>
      </section>`,

  };
  return guideContents[guideId] || '';
}

function buildGuidePages() {
  ensureDir(join(SITE_DIR, 'guides'));
  for (const guide of guides) {
    const content = getGuideContent(guide.id);

    const bc = breadcrumb([{name: '首页', href: '/'}, {name: '指南'}, {name: guide.title}]);

    // Build JSON-LD: Article + BreadcrumbList + optional FAQPage
    const jsonLdArray = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": guide.title,
        "description": guide.description,
        "url": SITE_URL + "/guides/" + guide.slug,
        "author": {"@type": "Organization", "name": SITE_NAME},
        "publisher": {"@type": "Organization", "name": SITE_NAME},
        "datePublished": "2026-05-18",
        "dateModified": "2026-05-18"
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "首页", "item": SITE_URL + "/"},
          {"@type": "ListItem", "position": 2, "name": "指南", "item": SITE_URL + "/guides/what-is-mcp"},
          {"@type": "ListItem", "position": 3, "name": guide.title, "item": SITE_URL + "/guides/" + guide.slug}
        ]
      }
    ];

    // Extract FAQ items from content if present
    const faqRegex = /<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>/g;
    const faqItems = [];
    let faqMatch;
    while ((faqMatch = faqRegex.exec(content)) !== null) {
      faqItems.push({
        "@type": "Question",
        "name": faqMatch[1].replace(/<[^>]*>/g, ''),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faqMatch[2].replace(/<[^>]*>/g, '')
        }
      });
    }
    if (faqItems.length > 0) {
      jsonLdArray.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems
      });
    }

    const html = layout(
      `${guide.title} - ${SITE_NAME}`,
      guide.description,
      `/guides/${guide.slug}.html`,
      content,
      bc,
      jsonLdArray
    );
    writeFileSync(join(SITE_DIR, 'guides', `${guide.slug}.html`), html);
  }
}

function buildSitemap() {
  const lastmod = '2026-05-18';
  const urls = [];

  // 首页: 1.0
  urls.push({loc: '/', priority: '1.0'});
  // 资料库页: 0.8
  urls.push({loc: '/servers/', priority: '0.8'});
  // 工具详情页: 0.7
  servers.forEach(s => urls.push({loc: `/servers/${s.slug}`, priority: '0.7'}));
  // 分类页: 0.6
  categories.forEach(c => urls.push({loc: `/categories/${c.slug}`, priority: '0.6'}));
  // 客户端教程页: 0.8
  clients.forEach(c => urls.push({loc: `/clients/${c.slug}`, priority: '0.8'}));
  // 指南页: 0.7
  guides.forEach(g => urls.push({loc: `/guides/${g.slug}`, priority: '0.7'}));
  // 工具页: 0.5
  urls.push({loc: '/tools/config-builder', priority: '0.5'});
  // 信任页面: 0.5
  urls.push({loc: '/pages/about', priority: '0.5'});
  urls.push({loc: '/pages/contact', priority: '0.5'});
  urls.push({loc: '/pages/privacy', priority: '0.5'});
  urls.push({loc: '/pages/disclaimer', priority: '0.5'});

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(SITE_DIR, 'sitemap.xml'), xml);
}

function buildRobots() {
  const content = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(join(SITE_DIR, 'robots.txt'), content);
}

// --- Main Execution ---
console.log('Building AI Agent & MCP Server 工具目录...');

buildIndex();
console.log('  ✓ 首页');

buildServersIndex();
console.log('  ✓ 资料库页');

for (const server of servers) {
  buildServerDetail(server);
}
console.log(`  ✓ ${servers.length} 个工具详情页`);

for (const category of categories) {
  buildCategoryPage(category);
}
console.log(`  ✓ ${categories.length} 个分类页`);

buildClientPages();
console.log(`  ✓ ${clients.length} 个客户端教程页`);

buildGuidePages();
console.log(`  ✓ ${guides.length} 个指南页`);

buildConfigBuilder();
console.log('  ✓ 配置生成器');

buildTrustPages();
console.log('  ✓ 信任页面');

buildSitemap();
console.log('  ✓ sitemap.xml');

buildRobots();
console.log('  ✓ robots.txt');

const totalPages = 1 + 1 + servers.length + categories.length + clients.length + guides.length + 1 + 4;
console.log(`\nDone! Generated ${totalPages} pages.`);
