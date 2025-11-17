# [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/report.md]
# フェーズ3移行に伴う 開発環境エラーレポート

**最終更新日: 2025-11-18**

## 1. 経緯: フェーズ3（マルチテナント化）への移行

1.  **認証の変更:** Firebase Google認証を導入。
2.  **ルーティングの導入:** `react-router-dom` を導入。
3.  **データ構造の変更:** FirestoreのDB構造を `timetables` コレクション（`ownerUid` で管理）に変更。
4.  **環境変数の分離:** Firebase APIキーを `.env.local` と `src/firebase.js` を使う形に変更。

---

## 2. エラー 1: ローカル環境での画面真っ白（`App is not defined`）

### 2.1. 症状

* `npm run dev` で `http://localhost:5173/` にアクセスすると画面が真っ白になる。
* コンソールに `ReferenceError: App is not defined at EditorPage.jsx:256` が表示される。
* Viteから `The server is configured with a public base URL of /DJTIMEKEEPER/ ...` という警告が出ていた。

### 2.2. 対策と解決

1.  **`vite.config.js` の修正:** `base: '/DJTIMEKEEPER/'` を `base: '/'` に修正。
2.  **`main.jsx` の修正:** `BrowserRouter` の `basename="/DJTIMEKEEPER/"` 属性を削除し、Viteの設定と統一。
3.  **`EditorPage.jsx` の修正:** `export default App;` という参照エラーを `export default EditorPage;` に修正。
4.  **Viteキャッシュの削除:** 上記1〜3を実行してもエラーが解消しなかったため、`node_modules/.vite` フォルダを `rm -rf` で強制削除し、サーバーを再起動した。
5.  **結果:** **ローカル環境の表示に成功。**

---

## 3. エラー 2: ステージング環境での画面真っ白（`auth/invalid-api-key`）

### 3.1. 症状

* ローカルの修正を `phase3-dev` ブランチにプッシュ。
* GitHub Actionsによるデプロイが成功し、プレビューURLにアクセス。
* 画面が真っ白になり、コンソールに `FirebaseError: Firebase: Error (auth/invalid-api-key)` が表示される。

### 3.2. 対策と解決

1.  **原因の特定:** `src/firebase.js` が `import.meta.env.VITE_...` からAPIキーを読み込もうとしたが、GitHub Actionsのビルド環境には `.env.local` が存在しないため、APIキーが `undefined` のままビルドされていた。
2.  **GitHub Secretsの登録（計7個）:**
    * **管理者キー (1個):** `FIREBASE_SERVICE_ACCOUNT_DJTABLE_2408D` （デプロイ用）
    * **アプリ設定キー (6個):** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` などの6つのキーをGitHub Actionsのシークレットに1つずつ登録。
3.  **ワークフローの修正:** `.github/workflows/firebase-hosting-preview.yml` の `Build Vite app` ステップに `env:` ブロックを追加。これにより、ビルド時にGitHub Secretsが `import.meta.env` に注入されるようになった。
4.  **結果:** **ステージング環境での `invalid-api-key` エラー解消。**

---

## 4. エラー 3: ログイン後のデータ読み書き不可（`Missing or insufficient permissions`）

### 4.1. 症状

* ローカル・ステージング共にログインは成功する（`ログイン成功: GLG...` と表示される）。
* しかし、直後に `イベントの読み込みに失敗: FirebaseError: Missing or insufficient permissions.` が発生する。
* ダッシュボード（`/`）で「新しいイベントを作成」 しても保存されない。
* ただし、作成 → 編集画面 → ブラウザバック の操作時のみ、ローカルキャッシュにより一瞬イベントが表示されるが、リロードすると消える。

### 4.2. 対策と解決（切り分け）

1.  **ルールデプロイ:** `firebase deploy --only firestore:rules` を実行。`latest version ... already up to date` と表示され、デプロイ自体は成功していることを確認。
2.  **DB作成確認:** Firebaseコンソールのスクリーンショット にて、`timetables` コレクションが存在し、データベースが作成済みであることを確認。
3.  **広告ブロッカー確認:** `net::ERR_BLOCKED_BY_CLIENT` が出ていたため、広告ブロッカーをOFFにし、Safariでも試したが、`Missing or insufficient permissions` は解消せず。
4.  **インデックス作成:** `DashboardPage.jsx` が `where("ownerUid", ...)` クエリを使っているため、Firestoreコンソールで `timetables` コレクションの `ownerUid` フィールド（昇順）のインデックスを作成。ステータスが「有効」になるまで待機。
5.  **（失敗）:** インデックスが「有効」になってもエラーが解消せず。

### 4.3. 真の原因と解決

1.  **`firestore.rules` の構文エラー:** 調査の結果、`firestore.rules` の `allow list` に書かれていた `request.query.where...` という構文が、**Firestoreではサポートされていない無効なルール**であったことが判明した。（旧Realtime Databaseの構文と混同していた）
2.  **`firestore.rules` の修正:** `allow list` のルールを、`request.query.where` を使った複雑な（そして無効な）検証から、シンプルに「**ログインしていればクエリの実行を許可する**」という意味の `if request.auth.uid != null;` に修正した。
3.  **ルールの再デプロイ:** 修正した `firestore.rules` を `firebase deploy --only firestore:rules` で再度デプロイ。
4.  **結果:** **エラー（`Missing or insufficient permissions`）が完全に解消。** ローカル・ステージング両方で、イベントの新規作成（保存）と一覧の読み込みが正常に動作することを確認した。