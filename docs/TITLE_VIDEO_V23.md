# 北の門 — タイトル映像

12秒・1280×720・24fps・無音H.264 High Level3.1 / YUV420PのMP4。容量3,178,191 B、bitrate2,118,794 bit/s、SHA256 `31bad03ee0d2151a7259ed35a9c05919003d32d1216107cb594da84d7b0a2e3c`。元の生成PNGを保持し、カメラの緩やかな移動、谷の霧、王冠/手の火光、灰を周期的に合成した **動くイラスト**。実ゲーム・実写・3D復元の映像ではない。

`python3 scripts/render-title-video.py` はnumpy2.3.5 / Pillow12.3.0 / FFmpeg6.1.1-libx264で再生成する。raw framesは保存しない。原画とgenerator・出力hashは `src/assets/title/provenance.json`、encoder全引数と制作wall timeは `docs/evidence/title-video/media.json`。`python3 scripts/verify-title-video.py` がcodec/container、全288frame、faststart、音声なし、loopと内部IDRの差分を記録する。

独立担当 `/root/ultra_q_title_video/independent_review_ultra` は匿名clip A/B、full-resolution焦点crop、portrait cropとdecoded全frameを確認。最終Bのloop RGB差分は320×180解析で1.181568/255、内部IDR最大1.177732/255（比1.003258）。冠・門・巡礼者・道にmaterialな細部喪失なし。これは実ブラウザー上の滑らかさ・演出の興奮・実端末FPS合格を証明しない。`frames.jpg` はencoded映像の0/3/6/9/11.958秒抜粋で、gameplay screenshotではない。

ブラウザーでは原画を先に表示し、document load後300msまでvideo.srcを空にする。タイトルが有効・可視・focus内で、減動/節約通信/利用者停止がない場合だけMP4を要求する。再生開始Promiseが成功してから絵から映像へ移る。mute/playsinline/loop/preload=none、映像に音声trackなし。音は既存の独立したgesture-only制御を維持する。

「動きを止める」は映像、canvas、CSS motionを停止する。減動/節約通信時は原画表示とし、動画を要求しない。非表示・title deactivate・disposeはpause→src除去→loadでbuffer/decoder解放を要求する（実browserの解放時刻は保証しない）。ブラウザーの再生拒否・decode errorは原画に戻り、明示ボタンから直接playを再試行できる。古いplay Promiseが新しいtitle/video所有者を停止しない。blur→focusの間に遅れて到着したpause eventも、timer/pending/現在pausedの状態で識別する。

縦向きcropは既存原画と同じ72%/28%、横は68%/50%、極端な横長では右寄せcontain。同じ絵をCSSのfallbackとして残す。WebsiteのMP4は遅延通信だが、単体HTMLはoffline用なので映像も最初から埋め込む。そのfile全体の容量と再生時の処理を、Websiteの初期JS/遅延通信と混同しない。

実装・媒体制作・統合は `/root/ultra_q_title_video`、独立reviewは上記子が担当。全spawn指定は `reasoning_effort=ultra, fork_turns=none, model omitted`。requested settingの受理と具体的成果を記録し、非公開の実効強度は断定しない。Sitesの所有者操作は親が子の確定操作だけを実行する。

実装根拠は [WebKitの無音video/playsinline方針](https://webkit.org/blog/6784/new-video-policies-for-ios/)、[Chromeの非同期play/pause/load解説](https://developer.chrome.com/blog/play-request-was-interrupted)、[play()のPromise仕様](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)。これらは今回の端末で再生成功した証拠ではない。

[PR #37](https://github.com/bachikoljunior-blip/Q/pull/37)、gameplay main `f11819aceea515d166846e4bf85082bf2e51e9d1` に通常統合済み。PR/main必須CI成功後、2026-09-15 12:08:03 UTCに同じowner-only Site version **23**へ反映。deployment `appgdep_6aa93515d90c81919955b9a14ff7d118` はsucceeded、sourceと公開範囲を正規readbackした。URLは https://q-ash-pilgrim.juurooo.chatgpt.site 。公開記録追記では映像・配信payloadを変更せず再deployしない。公式preview mailboxは不在のままで、Site上の実再生・端末性能・PS4相当の知覚品質は未確認。
