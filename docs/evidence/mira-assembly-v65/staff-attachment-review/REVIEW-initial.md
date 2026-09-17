# 独立技術レビュー — 初回候補

対象 `51f105b0f8a7834f498c24ae5c783c669776f4b4`、基点 `bc761f25aae76209d26623b509f97e1f3a5a12ca`。判定は **無効chain入力処理の修復が必要**。作者の保存した合格値・検査関数を独立採否の根拠に使わず、独自の `independent-check.mjs` を実行した。

## 必須修復

`review/staff-attachment-v65/attachment.mjs` の `update()` は、作成後のchainに対してNaNを明示検出せず、作成時に記録した長さを無条件に再使用する。

| 再現入力（正常に作成・updateした後） | 初回実結果 |
|---|---|
| `actor.hands[0].scale.x = NaN` | `ok:true`、杖visible、world行列と残差がNaN |
| `actor.elbows[0].scale.z = NaN` | 同上 |
| `actor.hands[0].position.y = NaN` | 同上 |
| `actor.hands[0].position.y = -.36` | `ok:true`、目標残差50 mm、接地残差1.801568610 mm |
| `actor.elbows[0].position.set(.03,-.33,0)` | `ok:true`、目標残差30 mm、上腕長331.360831 mm |

`distanceTo(one) > epsilon` はNaNを棄却しない。回転書込・world伝播の前にfinite変換と固定elbow/hand translation契約を検証し、無効時は腕を変更せず杖を隠すこと。以上は早期連絡済みで、レビュー担当はsourceを修正していない。

## 成立した限定範囲

実 `SceneView` のconstructor・update・NPC配置（7,heightAt(7,80),80／yaw1.4）を使用。Nodeではrendererとbrowser画像loaderだけを明示した代役へ置換し、GLコンテキスト・画素描画は行わない。別途、非一様scaleを持つ多段親、root変換、呼出間の親変更、body scaleを含む6条件×呼吸9時刻＝54frameを検査した。

- 実hand行列のlocal `[0,-.074,-.044]` と実杖grip `Y=1.135` の最大差 `1.7763568394e-15 m`。作者指定の接地目標との最大差 `1.5203165632e-14 m`。
- 全19partの実world行列による1026配置、各part頂点サンプル間距離、world全長1.7 mを検査。最大距離誤差 `1.0706713294e-14 m`。
- 元41骨の順序・rest、全bone translation/scale、左右反対腕とその他骨の回転、skin weight/index・bind行列・bone inverse、杖geometry byteを保持。既存skinのnative頂点評価1944サンプルはfinite。体表把持・袖衝突を評価した数ではない。
- 胸frameで330/310 mmを保持。world長を胸の非一様scaleから独立した値と誤称しない。
- 同一入力の256回反復は行列drift0。`animate → update → render` の順序を確認。逆順は次のanimateで腕が戻り、検査条件では510.420683 mmの握り点差になるため許容しない。
- 既存の無到達・非finite terrain・root zero・親反射/NaN・有限の非unit手scale・垂直headingは拒否し、次の正常poseで復帰した。

固定差分は研究adapter・検査・資料の6新規ファイルのみ。runtime import、Game/save、shape制作、bone restのsource変更は0。指surface grasp、袖clearance、旧杖除去、歩行/死亡/遷移の採否、全身組立、実画面・実機・PS4品質・指定10作品比較は未成立。全資料先行と2026-09-20期限を保持する。

独立担当canonical ID: `/root/ultra_q_recover_reference_assembly/cloth_registration_v65/cloth_image_check`。既受理Ultra担当を継続し、新しい子の起動0。実効推論強度は非公開で独立確認していない。初回作業開始2026-09-16T23:44:37Z、初回記録時点23:53:45Z（読取・設計・連絡・script・2回の有限検査を含む548秒）。確定scriptの検査は1.84088586秒で、制作全体の速度やフレーム性能ではない。ツールは全終端、remote0、source編集0。
