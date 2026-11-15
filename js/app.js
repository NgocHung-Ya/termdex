(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const ui = {
    search: $('#search-input'),
    categorySelect: $('#category-select'),
    categoryPills: $('#category-pills'),
    sort: $('#sort-select'),
    termList: $('#term-list'),
    state: $('#state-panel'),
    count: $('#results-count'),
    clear: $('#clear-filters'),
    tags: $('#popular-tags'),
    datasetStatus: $('#dataset-status'),
    announcer: $('#announcer'),
  };
  const state = { items: [], query: '', category: '', tag: '', sort: 'az', loading: true };
  let debounceTimer;

  const normalize = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLocaleLowerCase('vi')
    .trim();

  function editDistanceAtMostOne(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i += 1; j += 1; continue; }
      edits += 1;
      if (edits > 1) return false;
      if (a.length > b.length) i += 1;
      else if (b.length > a.length) j += 1;
      else { i += 1; j += 1; }
    }
    if (i < a.length || j < b.length) edits += 1;
    return edits <= 1;
  }

  function matchesQuery(item, query) {
    if (!query) return true;
    return query.split(/\s+/).filter(Boolean).every((token) => {
      if (item.searchText.includes(token)) return true;
      if (token.length < 5) return false;
      return item.searchWords.some((word) => word.length >= 4 && editDistanceAtMostOne(token, word));
    });
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setState(icon, title, message, actionLabel, action) {
    ui.termList.replaceChildren();
    ui.termList.setAttribute('aria-busy', 'false');
    ui.state.hidden = false;
    ui.state.replaceChildren();
    const mark = makeElement('div', 'state-icon', icon);
    mark.setAttribute('aria-hidden', 'true');
    const heading = makeElement('h3', '', title);
    const description = makeElement('p', '', message);
    ui.state.append(mark, heading, description);
    if (actionLabel && action) {
      const button = makeElement('button', 'state-action', actionLabel);
      button.type = 'button';
      button.addEventListener('click', action);
      ui.state.append(button);
    }
  }

  function setLoading() {
    ui.state.hidden = true;
    ui.termList.setAttribute('aria-busy', 'true');
    ui.termList.replaceChildren();
    for (let index = 0; index < 4; index += 1) {
      const skeleton = makeElement('div', 'skeleton-card');
      skeleton.setAttribute('aria-hidden', 'true');
      ui.termList.append(skeleton);
    }
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    state.query = params.get('q') || '';
    state.category = params.get('cat') || '';
    state.tag = params.get('tag') || '';
    ui.search.value = state.query;
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    if (state.query.trim()) params.set('q', state.query.trim());
    if (state.category) params.set('cat', state.category);
    if (state.tag) params.set('tag', state.tag);
    url.search = params.toString();
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function categoryNames() {
    return [...new Set(state.items.map((item) => item.category))].sort((a, b) => a.localeCompare(b, 'vi'));
  }

  function renderCategoryControls() {
    const categories = categoryNames();
    ui.categorySelect.replaceChildren(new Option('Tất cả chủ đề', ''));
    categories.forEach((category) => ui.categorySelect.add(new Option(category, category)));
    if (state.category && !categories.includes(state.category)) state.category = '';
    ui.categorySelect.value = state.category;

    ui.categoryPills.replaceChildren();
    const options = [['', 'Tất cả'], ...categories.map((category) => [category, category])];
    options.forEach(([value, label]) => {
      const button = makeElement('button', 'category-pill', label);
      button.type = 'button';
      button.dataset.category = value;
      button.setAttribute('aria-pressed', String(state.category === value));
      ui.categoryPills.append(button);
    });
  }

  function renderPopularTags() {
    const counts = new Map();
    state.items.forEach((item) => item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const popular = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')).slice(0, 10);
    ui.tags.replaceChildren();
    popular.forEach(([tag]) => {
      const button = makeElement('button', 'cloud-tag', tag);
      button.type = 'button';
      button.dataset.tag = tag;
      button.setAttribute('aria-pressed', String(state.tag === tag));
      ui.tags.append(button);
    });
  }

  function getFilteredItems() {
    const query = normalize(state.query);
    const filtered = state.items.filter((item) => {
      const categoryMatch = !state.category || item.category === state.category;
      const tagMatch = !state.tag || item.normalizedTags.includes(normalize(state.tag));
      return categoryMatch && tagMatch && matchesQuery(item, query);
    });
    return filtered.sort((a, b) => {
      const order = a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
      return state.sort === 'za' ? -order : order;
    });
  }

  function renderCard(item) {
    const card = makeElement('article', 'term-card');
    const header = makeElement('div', 'term-card-head');
    const titleGroup = makeElement('div');
    titleGroup.append(makeElement('p', 'term-category', item.category), makeElement('h3', '', item.title));
    const copy = makeElement('button', 'copy-button');
    copy.type = 'button';
    copy.dataset.copy = item.title;
    copy.setAttribute('aria-label', `Sao chép thuật ngữ ${item.title}`);
    copy.title = 'Sao chép thuật ngữ';
    copy.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="6" width="9" height="11" rx="1"></rect><path d="M13 6V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H7"></path></svg>';
    header.append(titleGroup, copy);
    const definition = makeElement('p', 'term-definition', item.content);
    const example = makeElement('p', 'term-example');
    const label = makeElement('strong', '', 'Ví dụ: ');
    example.append(label, document.createTextNode(item.example));
    const tags = makeElement('div', 'term-tags');
    item.tags.forEach((tag) => {
      const button = makeElement('button', 'term-tag', `#${tag}`);
      button.type = 'button';
      button.dataset.tag = tag;
      button.setAttribute('aria-label', `Lọc theo thẻ ${tag}`);
      tags.append(button);
    });
    card.append(header, definition, example, tags);
    return card;
  }

  function updateResults() {
    if (state.loading) return;
    const results = getFilteredItems();
    const activeCount = [state.query, state.category, state.tag].filter(Boolean).length;
    ui.clear.hidden = activeCount === 0;
    ui.categorySelect.value = state.category;
    [...ui.categoryPills.querySelectorAll('button')].forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    });
    [...ui.tags.querySelectorAll('button')].forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.tag === state.tag));
    });
    ui.count.innerHTML = `<strong>${results.length}</strong> / ${state.items.length} thuật ngữ${activeCount ? ' phù hợp' : ''}`;
    ui.datasetStatus.textContent = `${state.items.length} thuật ngữ · ${categoryNames().length} chủ đề`;
    ui.termList.setAttribute('aria-busy', 'false');
    ui.state.hidden = results.length > 0;
    if (!results.length) {
      setState('⌕', 'Chưa tìm thấy thuật ngữ phù hợp', 'Thử từ khóa khác, bỏ bớt bộ lọc hoặc xóa tìm kiếm để xem toàn bộ danh sách.', 'Xóa bộ lọc', clearFilters);
      return;
    }
    ui.termList.replaceChildren(...results.map(renderCard));
  }

  function clearFilters() {
    state.query = '';
    state.category = '';
    state.tag = '';
    ui.search.value = '';
    ui.categorySelect.value = '';
    syncUrl();
    updateResults();
    ui.search.focus();
  }

  async function copyTerm(term, button) {
    try {
      await navigator.clipboard.writeText(term);
      ui.announcer.textContent = `Đã sao chép ${term}`;
      button.title = 'Đã sao chép';
      window.setTimeout(() => { button.title = 'Sao chép thuật ngữ'; }, 1200);
    } catch {
      ui.announcer.textContent = 'Trình duyệt không cho phép sao chép tự động.';
    }
  }

  async function loadData() {
    state.loading = true;
    setLoading();
    try {
      const indexResponse = await fetch('./data/index.json');
      if (!indexResponse.ok) throw new Error(`Không tải được danh mục dữ liệu (${indexResponse.status}).`);
      const index = await indexResponse.json();
      if (!Array.isArray(index.files) || !index.files.length) throw new Error('Danh mục JSON chưa có danh sách tệp dữ liệu.');
      const sources = await Promise.all(index.files.map(async (file) => {
        const response = await fetch(`./data/${encodeURIComponent(file)}`);
        if (!response.ok) throw new Error(`Không tải được ${file} (${response.status}).`);
        return response.json();
      }));
      const items = sources.flatMap((source) => Array.isArray(source.items) ? source.items : []);
      if (!items.length) throw new Error('Các tệp JSON hiện chưa có thuật ngữ nào.');
      state.items = items.filter((item) => item && item.id && item.title && item.category && item.content && item.example)
        .map((item) => {
          const tags = Array.isArray(item.tags) ? item.tags.map(String) : [];
          const searchable = [item.title, item.category, item.content, item.example, ...tags].join(' ');
          return { ...item, tags, searchText: normalize(searchable), searchWords: normalize(searchable).split(/[^a-z0-9]+/).filter(Boolean), normalizedTags: tags.map(normalize) };
        });
      if (!state.items.length) throw new Error('Không có bản ghi JSON hợp lệ để hiển thị.');
      state.loading = false;
      renderCategoryControls();
      renderPopularTags();
      updateResults();
    } catch (error) {
      state.loading = false;
      ui.count.textContent = 'Không thể tải bộ dữ liệu';
      ui.datasetStatus.textContent = 'Cần kết nối để tải JSON';
      ui.clear.hidden = true;
      setState('!', 'Dữ liệu chưa sẵn sàng', `${error.message} Hãy mở website qua máy chủ HTTP/HTTPS (ví dụ GitHub Pages), sau đó thử tải lại.`, 'Thử lại', loadData);
    }
  }

  function bindEvents() {
    ui.search.addEventListener('input', () => {
      state.query = ui.search.value;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => { syncUrl(); updateResults(); }, 150);
    });
    $('#search-form').addEventListener('submit', (event) => {
      event.preventDefault();
      window.clearTimeout(debounceTimer);
      state.query = ui.search.value;
      syncUrl();
      updateResults();
      $('#term-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    ui.categorySelect.addEventListener('change', () => {
      state.category = ui.categorySelect.value;
      syncUrl();
      updateResults();
    });
    ui.categoryPills.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = button.dataset.category;
      syncUrl();
      updateResults();
    });
    ui.sort.addEventListener('change', () => { state.sort = ui.sort.value; updateResults(); });
    ui.tags.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      state.tag = state.tag === button.dataset.tag ? '' : button.dataset.tag;
      syncUrl();
      updateResults();
    });
    ui.termList.addEventListener('click', (event) => {
      const tagButton = event.target.closest('.term-tag');
      if (tagButton) {
        state.tag = state.tag === tagButton.dataset.tag ? '' : tagButton.dataset.tag;
        syncUrl();
        updateResults();
        return;
      }
      const copyButton = event.target.closest('[data-copy]');
      if (copyButton) copyTerm(copyButton.dataset.copy, copyButton);
    });
    ui.clear.addEventListener('click', clearFilters);
    window.addEventListener('popstate', () => {
      readUrlState();
      renderCategoryControls();
      renderPopularTags();
      updateResults();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        ui.search.focus();
      }
      if (event.key === 'Escape' && document.activeElement === ui.search) ui.search.blur();
    });
    $('#current-year').textContent = String(new Date().getFullYear());
  }

  readUrlState();
  bindEvents();
  loadData();
})();
