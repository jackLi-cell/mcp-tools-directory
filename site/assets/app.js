/* AI Agent & MCP Server 工具目录 - 前端交互 */
(function() {
  'use strict';

  // --- Copy buttons ---
  document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('copy-btn')) return;
    var text = e.target.getAttribute('data-copy');
    if (!text) {
      var code = e.target.closest('.code-block');
      if (code) text = code.querySelector('code').textContent;
    }
    if (!text) return;
    navigator.clipboard.writeText(text).then(function() {
      var original = e.target.textContent;
      e.target.textContent = '已复制';
      setTimeout(function() { e.target.textContent = original; }, 1500);
    });
  });

  // --- Search ---
  var searchInput = document.getElementById('search-input');
  var serversTable = document.getElementById('servers-table');

  if (searchInput && serversTable) {
    // We are on the servers/index page — support live filtering + URL param
    var params = new URLSearchParams(window.location.search);
    var initialQ = params.get('q');
    if (initialQ) {
      searchInput.value = initialQ;
      filterTable(initialQ.toLowerCase().trim());
    }

    searchInput.addEventListener('input', function() {
      filterTable(this.value.toLowerCase().trim());
    });

    function filterTable(query) {
      var rows = document.querySelectorAll('#servers-table tbody tr');
      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    }
  } else if (searchInput && !serversTable) {
    // We are on the homepage — redirect to servers page on Enter
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var query = this.value.trim();
        if (query) {
          window.location.href = './servers/index.html?q=' + encodeURIComponent(query);
        }
      }
    });
  }

  // --- Filters (servers page) ---
  var filterCategory = document.getElementById('filter-category');
  var filterRisk = document.getElementById('filter-risk');
  var filterApikey = document.getElementById('filter-apikey');

  function applyFilters() {
    var cat = filterCategory ? filterCategory.value : '';
    var risk = filterRisk ? filterRisk.value : '';
    var apikey = filterApikey ? filterApikey.value : '';
    var rows = document.querySelectorAll('#servers-table tbody tr');
    rows.forEach(function(row) {
      var show = true;
      if (cat && row.dataset.category !== cat) show = false;
      if (risk && row.dataset.risk !== risk) show = false;
      if (apikey && row.dataset.apikey !== apikey) show = false;
      row.style.display = show ? '' : 'none';
    });
  }

  if (filterCategory) filterCategory.addEventListener('change', applyFilters);
  if (filterRisk) filterRisk.addEventListener('change', applyFilters);
  if (filterApikey) filterApikey.addEventListener('change', applyFilters);

  // --- Config Builder ---
  var configOutput = document.getElementById('config-output');
  var copyConfigBtn = document.getElementById('copy-config-btn');
  var clientSelect = document.getElementById('client-select');
  var serverCheckboxes = document.getElementById('server-checkboxes');

  if (configOutput && serverCheckboxes) {
    var serversData = null;
    var pathEl = document.querySelector('[data-servers-path]');
    var serversPath = pathEl ? pathEl.getAttribute('data-servers-path') : '../data/servers.json';
    fetch(serversPath)
      .then(function(r) { return r.json(); })
      .catch(function() { return null; })
      .then(function(data) { serversData = data; });

    function updateConfig() {
      var checked = serverCheckboxes.querySelectorAll('input:checked');
      if (checked.length === 0) {
        configOutput.textContent = '请选择至少一个 MCP Server';
        return;
      }
      if (!serversData) {
        configOutput.textContent = '数据加载中...';
        return;
      }
      var config = { mcpServers: {} };
      checked.forEach(function(cb) {
        var server = serversData.find(function(s) { return s.id === cb.value; });
        if (server && server.configExample && server.configExample.mcpServers) {
          Object.assign(config.mcpServers, server.configExample.mcpServers);
        }
      });
      configOutput.textContent = JSON.stringify(config, null, 2);
    }

    serverCheckboxes.addEventListener('change', updateConfig);
    if (clientSelect) clientSelect.addEventListener('change', updateConfig);

    if (copyConfigBtn) {
      copyConfigBtn.addEventListener('click', function() {
        var text = configOutput.textContent;
        if (text && text !== '请选择至少一个 MCP Server') {
          navigator.clipboard.writeText(text).then(function() {
            copyConfigBtn.textContent = '已复制';
            setTimeout(function() { copyConfigBtn.textContent = '复制配置'; }, 1500);
          });
        }
      });
    }
  }
})();
