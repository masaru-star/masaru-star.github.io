const worksData = [
  { title: '軍艦シューティング', url: 'works/threejs/ver1/play.html', tags: ['ゲーム全般', 'シミュレーション', 'JavaScript'], shortDesc: 'three.jsを使用した射的ゲーム。', detailDesc: 'three.jsを学習して初期に制作した3Dシューティングゲームです。マウス操作で照準を合わせ、敵艦を撃破します。', created: '2025.12', updated: '2025.12' },
  { title: 'Navel Command', url: 'works/threejs/Ver2/naval-command.html', tags: ['ゲーム全般', 'シミュレーション', 'JavaScript'], shortDesc: '軍艦シューティングのリメイク作品。', detailDesc: '過去の軍艦シューティングをベースに、グラフィックと操作性を向上させたリメイク版です。', created: '2026.07', updated: '2026.08' },
  { title: '箱庭諸島風', url: 'https://masaru-star.github.io/JS.Hakoniwa-Island/', tags: ['ゲーム全般', 'シミュレーション', 'JavaScript'], shortDesc: 'CGIゲーム「箱庭諸島」のオマージュ作品。', detailDesc: '毎ターン行動を予約し、島の発展や他島との交流を楽しめるシミュレーションゲームです。', created: '2025.08', updated: '2026.09', isNew: true },
  { title: '戦争の霧', url: 'works/vanillajs/fogwar/play.html', tags: ['ゲーム全般', 'シミュレーション', 'JavaScript'], shortDesc: 'ターン制のストラテジーゲーム。', detailDesc: '視界の概念を取り入れ、見えない敵の動きを予測しながら部隊を動かす戦術シミュレーションです。', created: '2025.10', updated: '2025.12' },
  { title: 'HACKER TERMINAL', url: 'works/vanillajs/hackpass/play.html', tags: ['ゲーム全般', 'JavaScript'], shortDesc: 'パスワード認証を突破するミニゲーム。', detailDesc: 'ハッキングのUIを模したミニゲームです。認証システムを突破する遊びを実装しています。', created: '2025.11', updated: '2025.12' },
  { title: 'マインスイーパー', url: 'works/vanillajs/minesweeper.html', tags: ['ゲーム全般', 'シンプルなゲーム', 'JavaScript'], shortDesc: '王道ゲームの再現作品。', detailDesc: '空白の一括解放やフラグ立てなど、標準的なマインスイーパーの機能を備えています。', created: '2025.12', updated: '2025.12' },
  { title: 'PC用テトリス', url: 'works/vanillajs/tetris.html', tags: ['ゲーム全般', 'シンプルなゲーム', 'JavaScript'], shortDesc: 'ランキング機能付きのテトリス。', detailDesc: 'キーボード操作に最適化し、ホールド機能とローカルストレージによるスコア保存を実装しました。', created: '2025.12', updated: '2025.12' },
  { title: 'Image-Key Crypto', url: 'https://masaru-star.github.io/image-key/', tags: ['ツール', 'JavaScript'], shortDesc: '画像を暗号鍵として使用するツール。', detailDesc: '画像ファイルのピクセルデータから鍵を生成し、テキストデータを暗号化・復号化します。', created: '2026.01', updated: '2026.01' },
  { title: '車窓.html', url: 'works/css/play.html', tags: ['アート', 'CSS'], shortDesc: 'CSSアニメーションの練習用作品。', detailDesc: '列車の窓から見える風景をJavaScript、HTML、CSSで表現したアニメーションです。', created: '2026.02', updated: '2026.02' },
  { title: '（個人用）CoC6版用キャラシ', url: 'funs/coc6.html', tags: ['ゲーム全般', 'メモ'], shortDesc: 'TRPG用のキャラクターシート。', detailDesc: 'クトゥルフ神話TRPG第6版を遊ぶ際に使う、個人的なデジタルキャラクターシートです。', created: '2026.05', updated: '2026.05' }
];

const socialLinksData = [
  { title: 'GitHub', url: 'https://github.com/masaru-star', desc: 'ソースコードやプロジェクトを公開しています。', icon: 'icons/github.svg' },
  { title: 'YouTube', url: 'https://youtube.com/@teriarus', desc: 'チャンネル「@teriarus」で動画を投稿しています。', icon: 'icons/youtube.svg' },
  { title: 'X (Twitter)', url: 'https://x.com/masaru_pg7', desc: '日常のつぶやきや進捗報告を発信しています。', icon: 'icons/x.svg' },
  { title: 'Qiita', url: 'https://qiita.com/masaru-star', desc: '技術的な備忘録や記事を書いています。', icon: 'icons/qiita.svg' }
];

// 相互リンクはこの配列に { title, url, desc } を追加して管理します。
const reciprocalLinksData = [];
