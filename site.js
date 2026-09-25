const sitePages = [
  ['index.html', 'トップ'], ['about.html', 'プロフィール'], ['hobbies.html', '趣味'],
  ['works.html', '作品'], ['links.html', 'リンク'], ['mutual-links.html', '相互リンク']
];

function renderSiteChrome(activePage) {
  const nav = sitePages.map(([href, label]) => `<a href="${href}"${href === activePage ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  document.querySelectorAll('[data-site-header]').forEach(el => el.innerHTML = `<header class="site-header"><div class="header-inner"><a class="brand" href="index.html">真優の開発工廠</a><nav class="site-nav" aria-label="主要メニュー">${nav}</nav></div></header>`);
  document.querySelectorAll('[data-site-footer]').forEach(el => el.innerHTML = `<footer class="site-footer"><div class="container footer-inner"><div class="footer-links">${nav}</div><div>&copy; 2025–2026 Ohka_M. All Rights Reserved.</div></div></footer>`);
}
